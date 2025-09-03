const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication and authorization middleware to all routes
router.use(authenticateToken);
router.use(requireSuperAdmin);

// GET /api/v1/superadmin/audit-logs - Get audit logs with filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      userName, 
      userEmail,
      action, 
      targetType,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    // Handle action and target type filters
    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    // Date range filter
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Build order by
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Get audit logs with actor details
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      skip,
      take,
      orderBy
    });

    // Filter by user name or email if specified
    let filteredLogs = auditLogs;
    
    if (userName) {
      filteredLogs = filteredLogs.filter(log => 
        log.actor && log.actor.name && 
        log.actor.name.toLowerCase().includes(userName.toLowerCase())
      );
    }
    
    if (userEmail) {
      filteredLogs = filteredLogs.filter(log => 
        log.actor && log.actor.email && 
        log.actor.email.toLowerCase().includes(userEmail.toLowerCase())
      );
    }
    
    // Get total count after filtering
    const total = userName || userEmail ? filteredLogs.length : await prisma.auditLog.count({ where });

    // Format response
    const formattedLogs = filteredLogs.map(log => ({
      ...log,
      details: log.details ? (() => {
        try {
          return JSON.parse(log.details);
        } catch (parseError) {
          // If details is not valid JSON, return it as a string
          return log.details;
        }
      })() : null,
      actor: log.actor
    }));

    res.json({
      auditLogs: formattedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/v1/superadmin/audit-logs/actions - Get available actions
router.get('/actions', async (req, res) => {
  try {
    const actions = await prisma.auditLog.findMany({
      select: {
        action: true
      },
      distinct: ['action'],
      orderBy: {
        action: 'asc'
      }
    });

    res.json({
      actions: actions.map(a => a.action)
    });

  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/v1/superadmin/audit-logs/target-types - Get available target types
router.get('/target-types', async (req, res) => {
  try {
    const targetTypes = await prisma.auditLog.findMany({
      select: {
        targetType: true
      },
      distinct: ['targetType'],
      orderBy: {
        targetType: 'asc'
      }
    });

    res.json({
      targetTypes: targetTypes.map(t => t.targetType)
    });

  } catch (error) {
    console.error('Get target types error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/v1/superadmin/audit-logs/summary - Get audit summary
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where clause for date range
    const where = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Get counts by action
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      }
    });

    // Get counts by target type
    const targetTypeCounts = await prisma.auditLog.groupBy({
      by: ['targetType'],
      where,
      _count: {
        targetType: true
      },
      orderBy: {
        _count: {
          targetType: 'desc'
        }
      }
    });

    // Get total count
    const totalCount = await prisma.auditLog.count({ where });

    // Get recent activity (last 10 logs)
    const recentActivity = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      take: 10,
      orderBy: {
        timestamp: 'desc'
      }
    });

    res.json({
      summary: {
        totalCount,
        actionCounts: actionCounts.map(ac => ({
          action: ac.action,
          count: ac._count.action
        })),
        targetTypeCounts: targetTypeCounts.map(ttc => ({
          targetType: ttc.targetType,
          count: ttc._count.targetType
        }))
      },
      recentActivity: recentActivity.map(log => ({
        ...log,
        details: log.details ? (() => {
          try {
            return JSON.parse(log.details);
          } catch (parseError) {
            // If details is not valid JSON, return it as a string
            return log.details;
          }
        })() : null,
        actor: log.actor
      }))
    });

  } catch (error) {
    console.error('Get audit summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;