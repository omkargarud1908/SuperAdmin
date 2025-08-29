const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication and authorization middleware to all routes
router.use(authenticateToken);
router.use(requireSuperAdmin);

// GET /api/v1/superadmin/analytics/summary - Get analytics summary
router.get('/summary', async (req, res) => {
  try {
    // Get current date and 7 days ago
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Get total counts
    const totalUsers = await prisma.user.count();
    const totalRoles = await prisma.role.count();
    const totalAuditLogs = await prisma.auditLog.count();

    // Get active users (users who logged in last 7 days)
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: sevenDaysAgo
        }
      }
    });

    // Get logins in last 7 days
    const loginsLast7Days = await prisma.auditLog.count({
      where: {
        action: 'LOGIN',
        timestamp: {
          gte: sevenDaysAgo
        }
      }
    });

    // Get user registration trend (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const newUsersLast30Days = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get role distribution
    const roleDistribution = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });

    // Get recent activity (last 10 actions)
    const recentActivity = await prisma.auditLog.findMany({
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

    // Get top actions
    const topActions = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      },
      take: 5
    });

    // Get daily login trend for last 7 days
    const dailyLogins = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000));

      const loginCount = await prisma.auditLog.count({
        where: {
          action: 'LOGIN',
          timestamp: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      });

      dailyLogins.push({
        date: startOfDay.toISOString().split('T')[0],
        count: loginCount
      });
    }

    res.json({
      totalUsers,
      totalRoles,
      totalAuditLogs,
      activeUsersLast7Days: activeUsers,
      loginsLast7Days,
      newUsersLast30Days,
      roleDistribution: roleDistribution.map(role => ({
        name: role.name,
        userCount: role._count.userRoles
      })),
      topActions: topActions.map(action => ({
        action: action.action,
        count: action._count.action
      })),
      dailyLogins,
      recentActivity: recentActivity.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
        actor: log.actor
      }))
    });

  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/v1/superadmin/analytics/users - Get user analytics
router.get('/users', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    // Get user registration trend
    const userRegistrations = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get users by role
    const usersByRole = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });

    // Get recently active users
    const recentlyActiveUsers = await prisma.user.findMany({
      where: {
        lastLogin: {
          gte: startDate
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        lastLogin: 'desc'
      },
      take: 10
    });

    res.json({
      userRegistrations: userRegistrations.map(reg => ({
        date: reg.createdAt.toISOString().split('T')[0],
        count: reg._count.id
      })),
      usersByRole: usersByRole.map(role => ({
        role: role.name,
        count: role._count.userRoles
      })),
      recentlyActiveUsers: recentlyActiveUsers.map(user => ({
        ...user,
        roles: user.userRoles.map(ur => ur.role.name)
      }))
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/v1/superadmin/analytics/activity - Get activity analytics
router.get('/activity', async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    // Get activity by action type
    const activityByAction = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      }
    });

    // Get activity by user
    const activityByUser = await prisma.auditLog.groupBy({
      by: ['actorUserId'],
      where: {
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        actorUserId: true
      },
      orderBy: {
        _count: {
          actorUserId: 'desc'
        }
      },
      take: 10
    });

    // Get user details for activity by user
    const userActivityDetails = await Promise.all(
      activityByUser.map(async (activity) => {
        const user = await prisma.user.findUnique({
          where: { id: activity.actorUserId },
          select: { id: true, name: true, email: true }
        });
        return {
          user,
          actionCount: activity._count.actorUserId
        };
      })
    );

    // Get hourly activity distribution for today
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + (24 * 60 * 60 * 1000));

    const hourlyActivity = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(startOfToday.getTime() + (hour * 60 * 60 * 1000));
      const hourEnd = new Date(hourStart.getTime() + (60 * 60 * 1000));

      const count = await prisma.auditLog.count({
        where: {
          timestamp: {
            gte: hourStart,
            lt: hourEnd
          }
        }
      });

      hourlyActivity.push({
        hour: hour,
        count: count
      });
    }

    res.json({
      activityByAction: activityByAction.map(action => ({
        action: action.action,
        count: action._count.action
      })),
      activityByUser: userActivityDetails,
      hourlyActivity
    });

  } catch (error) {
    console.error('Get activity analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;