const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { logAuditEvent } = require('../middleware/auditLog');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication and authorization middleware to all routes
router.use(authenticateToken);
router.use(requireSuperAdmin);

// GET /api/v1/superadmin/users - List users with filters and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.userRoles = {
        some: {
          role: {
            name: role
          }
        }
      };
    }

    // Build order by
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Get users with roles
    const users = await prisma.user.findMany({
      where,
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      },
      skip,
      take,
      orderBy
    });

    // Get total count
    const total = await prisma.user.count({ where });

    // Format response
    const formattedUsers = users.map(user => {
      const { hashedPassword, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        roles: user.userRoles.map(ur => ur.role.name)
      };
    });

    res.json({
      users: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/v1/superadmin/users/:id - Get user detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        auditLogs: {
          take: 10,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { hashedPassword, ...userWithoutPassword } = user;
    
    res.json({
      user: {
        ...userWithoutPassword,
        roles: user.userRoles.map(ur => ur.role.name)
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/v1/superadmin/users - Create user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, roles = [] } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required' 
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        roles: roles
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    // Assign roles if provided
    if (roles.length > 0) {
      for (const roleName of roles) {
        const role = await prisma.role.findUnique({
          where: { name: roleName }
        });
        
        if (role) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id
            }
          });
        }
      }
    }

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'CREATE_USER',
      'USER',
      user.id,
      { email: user.email, name: user.name }
    );

    const { hashedPassword: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        ...userWithoutPassword,
        roles: user.userRoles.map(ur => ur.role.name)
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/v1/superadmin/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, roles } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.hashedPassword = await bcrypt.hash(password, 12);
    if (roles) updateData.roles = roles;

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    // Update roles if provided
    if (roles) {
      // Remove existing roles
      await prisma.userRole.deleteMany({
        where: { userId: id }
      });

      // Add new roles
      for (const roleName of roles) {
        const role = await prisma.role.findUnique({
          where: { name: roleName }
        });
        
        if (role) {
          await prisma.userRole.create({
            data: {
              userId: id,
              roleId: role.id
            }
          });
        }
      }
    }

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'UPDATE_USER',
      'USER',
      id,
      { email: user.email, name: user.name }
    );

    const { hashedPassword, ...userWithoutPassword } = user;
    
    res.json({
      message: 'User updated successfully',
      user: {
        ...userWithoutPassword,
        roles: user.userRoles.map(ur => ur.role.name)
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/v1/superadmin/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({ 
        message: 'Cannot delete your own account' 
      });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'DELETE_USER',
      'USER',
      id,
      { email: user.email, name: user.name }
    );

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;