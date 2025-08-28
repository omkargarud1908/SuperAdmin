const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { logAuditEvent } = require('../middleware/auditLog');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication and authorization middleware to all routes
router.use(authenticateToken);
router.use(requireSuperAdmin);

// GET /api/v1/superadmin/roles - List all roles
router.get('/', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedRoles = roles.map(role => ({
      ...role,
      userCount: role.userRoles.length,
      users: role.userRoles.map(ur => ur.user)
    }));

    res.json({ roles: formattedRoles });

  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/v1/superadmin/roles/:id - Get role detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json({
      role: {
        ...role,
        userCount: role.userRoles.length,
        users: role.userRoles.map(ur => ur.user)
      }
    });

  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/v1/superadmin/roles - Create role
router.post('/', async (req, res) => {
  try {
    const { name, permissions = [] } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ 
        message: 'Role name is required' 
      });
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return res.status(400).json({ 
        message: 'Role with this name already exists' 
      });
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        name,
        permissions
      }
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'CREATE_ROLE',
      'ROLE',
      role.id,
      { name: role.name, permissions }
    );

    res.status(201).json({
      message: 'Role created successfully',
      role
    });

  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/v1/superadmin/roles/:id - Update role
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if new name conflicts with existing role
    if (name && name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name }
      });

      if (nameConflict) {
        return res.status(400).json({ 
          message: 'Role with this name already exists' 
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (permissions) updateData.permissions = permissions;

    // Update role
    const role = await prisma.role.update({
      where: { id },
      data: updateData
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'UPDATE_ROLE',
      'ROLE',
      id,
      { name: role.name, permissions: role.permissions }
    );

    res.json({
      message: 'Role updated successfully',
      role
    });

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/v1/superadmin/roles/:id - Delete role
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: true
      }
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent deleting superadmin role
    if (role.name === 'superadmin') {
      return res.status(400).json({ 
        message: 'Cannot delete superadmin role' 
      });
    }

    // Check if role is assigned to any users
    if (role.userRoles.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete role that is assigned to users' 
      });
    }

    // Delete role
    await prisma.role.delete({
      where: { id }
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'DELETE_ROLE',
      'ROLE',
      id,
      { name: role.name }
    );

    res.json({ message: 'Role deleted successfully' });

  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/v1/superadmin/assign-role - Assign role to user
router.post('/assign-role', async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    // Validate input
    if (!userId || !roleId) {
      return res.status(400).json({ 
        message: 'User ID and Role ID are required' 
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if role is already assigned
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        message: 'Role is already assigned to this user' 
      });
    }

    // Assign role
    await prisma.userRole.create({
      data: {
        userId,
        roleId
      }
    });

    // Update user's roles array
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true }
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        roles: userRoles.map(ur => ur.role.name)
      }
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'ASSIGN_ROLE',
      'USER_ROLE',
      `${userId}-${roleId}`,
      { 
        userId, 
        roleId, 
        userName: user.name, 
        roleName: role.name 
      }
    );

    res.json({
      message: 'Role assigned successfully',
      assignment: {
        userId,
        roleId,
        userName: user.name,
        roleName: role.name
      }
    });

  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/v1/superadmin/assign-role - Remove role from user
router.delete('/assign-role', async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    // Validate input
    if (!userId || !roleId) {
      return res.status(400).json({ 
        message: 'User ID and Role ID are required' 
      });
    }

    // Check if assignment exists
    const assignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      },
      include: {
        user: true,
        role: true
      }
    });

    if (!assignment) {
      return res.status(404).json({ 
        message: 'Role assignment not found' 
      });
    }

    // Prevent removing superadmin role from superadmin users
    if (assignment.role.name === 'superadmin') {
      const superAdminUsers = await prisma.userRole.count({
        where: {
          role: { name: 'superadmin' }
        }
      });

      if (superAdminUsers <= 1) {
        return res.status(400).json({ 
          message: 'Cannot remove the last superadmin role' 
        });
      }
    }

    // Remove role assignment
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    // Update user's roles array
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true }
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        roles: userRoles.map(ur => ur.role.name)
      }
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      'REMOVE_ROLE',
      'USER_ROLE',
      `${userId}-${roleId}`,
      { 
        userId, 
        roleId, 
        userName: assignment.user.name, 
        roleName: assignment.role.name 
      }
    );

    res.json({
      message: 'Role removed successfully',
      removal: {
        userId,
        roleId,
        userName: assignment.user.name,
        roleName: assignment.role.name
      }
    });

  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;