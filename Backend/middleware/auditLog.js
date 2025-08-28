const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware to log audit events
const logAuditEvent = async (actorUserId, action, targetType, targetId, details = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        targetType,
        targetId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

// Helper function to create audit log entry
const createAuditLog = (action, targetType, targetId, details = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAuditEvent(
          req.user.id,
          action,
          targetType,
          targetId,
          details
        );
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  logAuditEvent,
  createAuditLog
};