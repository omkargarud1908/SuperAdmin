const express = require('express');
const router = express.Router();
const inactiveUserService = require('../services/inactiveUserService');
const cronService = require('../services/cronService');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get inactive user statistics
router.get('/stats', authenticateToken, requireRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const stats = await inactiveUserService.getInactiveUserStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting inactive user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inactive user statistics',
      error: error.message
    });
  }
});

// Get list of inactive users (eligible for reminders)
router.get('/inactive-users', authenticateToken, requireRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const inactiveUsers = await inactiveUserService.findInactiveUsers();
    res.json({
      success: true,
      data: inactiveUsers
    });
  } catch (error) {
    console.error('Error getting inactive users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inactive users',
      error: error.message
    });
  }
});

// Get all inactive users (regardless of reminder eligibility)
router.get('/all-inactive-users', authenticateToken, requireRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (parseInt(process.env.INACTIVITY_THRESHOLD_DAYS) || 7));
    
    const allInactiveUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { lastActivity: { lt: cutoffDate } },
          { lastActivity: null },
          {
            AND: [
              { lastActivity: { gte: cutoffDate } },
              { lastLogin: { lt: cutoffDate } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastActivity: true,
        lastLogin: true,
        lastReminderSent: true,
        reminderCount: true
      }
    });
    
    await prisma.$disconnect();
    
    res.json({
      success: true,
      data: allInactiveUsers
    });
  } catch (error) {
    console.error('Error getting all inactive users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get all inactive users',
      error: error.message
    });
  }
});

// Send reminder to a specific user
router.post('/send-reminder/:userId', authenticateToken, requireRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user details first
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        lastActivity: true,
        lastLogin: true,
        lastReminderSent: true,
        reminderCount: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const result = await inactiveUserService.sendReminderToUser(user, req.user.id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Reminder sent successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send reminder',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder',
      error: error.message
    });
  }
});

// Send reminders to all inactive users
router.post('/send-reminders', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const result = await inactiveUserService.sendRemindersToAllInactiveUsers(req.user.id);
    res.json({
      success: true,
      message: 'Reminder campaign completed',
      data: result
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders',
      error: error.message
    });
  }
});

// Mark user as active (update last activity)
router.put('/mark-active/:userId', authenticateToken, requireRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await inactiveUserService.markUserActive(userId);
    
    res.json({
      success: true,
      message: 'User marked as active',
      data: result
    });
  } catch (error) {
    console.error('Error marking user as active:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark user as active',
      error: error.message
    });
  }
});

// Reset user reminders
router.put('/reset-reminders/:userId', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await inactiveUserService.resetUserReminders(userId);
    
    res.json({
      success: true,
      message: 'User reminders reset successfully',
      data: result
    });
  } catch (error) {
    console.error('Error resetting user reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset user reminders',
      error: error.message
    });
  }
});

// Get cron job status
router.get('/cron-status', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const status = cronService.getJobStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting cron status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cron job status',
      error: error.message
    });
  }
});

// Manually trigger reminder job
router.post('/trigger-reminder-job', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const result = await cronService.triggerReminderJob();
    res.json({
      success: true,
      message: 'Reminder job triggered successfully',
      data: result
    });
  } catch (error) {
    console.error('Error triggering reminder job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger reminder job',
      error: error.message
    });
  }
});

// Manually trigger cleanup job
router.post('/trigger-cleanup-job', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const result = await cronService.triggerCleanupJob();
    res.json({
      success: true,
      message: 'Cleanup job triggered successfully',
      data: result
    });
  } catch (error) {
    console.error('Error triggering cleanup job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger cleanup job',
      error: error.message
    });
  }
});

// Restart cron jobs
router.post('/restart-cron', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    cronService.restart();
    res.json({
      success: true,
      message: 'Cron jobs restarted successfully'
    });
  } catch (error) {
    console.error('Error restarting cron jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restart cron jobs',
      error: error.message
    });
  }
});

// Stop all cron jobs
router.post('/stop-cron', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    cronService.stopAllJobs();
    res.json({
      success: true,
      message: 'All cron jobs stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping cron jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop cron jobs',
      error: error.message
    });
  }
});

// Start test job (runs every minute for testing)
router.post('/start-test-job', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    cronService.scheduleTestJob();
    res.json({
      success: true,
      message: 'Test job started - will run every minute for testing'
    });
  } catch (error) {
    console.error('Error starting test job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start test job',
      error: error.message
    });
  }
});

// Stop test job
router.post('/stop-test-job', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const stopped = cronService.stopTestJob();
    res.json({
      success: true,
      message: stopped ? 'Test job stopped successfully' : 'Test job was not running'
    });
  } catch (error) {
    console.error('Error stopping test job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop test job',
      error: error.message
    });
  }
});

module.exports = router;
