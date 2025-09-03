const { PrismaClient } = require('@prisma/client');
const emailService = require('./emailService');

const prisma = new PrismaClient();

class InactiveUserService {
  constructor() {
    this.inactivityThreshold = parseInt(process.env.INACTIVITY_THRESHOLD_DAYS) || 7; // Default 7 days
    this.maxReminders = parseInt(process.env.MAX_REMINDERS) || 3; // Default 3 reminders
    this.reminderInterval = parseInt(process.env.REMINDER_INTERVAL_DAYS) || 1; // Default 1 day
  }

  async getSystemUserId() {
    try {
      // Try to find existing system user
      let systemUser = await prisma.user.findFirst({
        where: { email: 'system@automated.com' }
      });

      if (!systemUser) {
        // Create system user if it doesn't exist
        systemUser = await prisma.user.create({
          data: {
            name: 'System (Automated)',
            email: 'system@automated.com',
            hashedPassword: 'system-user-no-login', // This user cannot login
            isActive: true,
            roles: ['system']
          }
        });
      }

      return systemUser.id;
    } catch (error) {
      console.error('Error getting system user ID:', error);
      return null; // Fallback to null if system user creation fails
    }
  }

  async findInactiveUsers() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.inactivityThreshold);

      const inactiveUsers = await prisma.user.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                // Check lastLogin first (more reliable for actual user activity)
                { lastLogin: { lt: cutoffDate } },
                { lastLogin: null },
                // Also check lastActivity as fallback
                { lastActivity: { lt: cutoffDate } },
                { lastActivity: null }
              ]
            },
            {
              OR: [
                { lastReminderSent: { lt: new Date(Date.now() - this.reminderInterval * 24 * 60 * 60 * 1000) } },
                { lastReminderSent: null }
              ]
            },
            { reminderCount: { lt: this.maxReminders } }
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

      return inactiveUsers;
    } catch (error) {
      console.error('Error finding inactive users:', error);
      throw error;
    }
  }

  async sendReminderToUser(user, actorUserId = null) {
    try {
      // Send reminder email
      const emailResult = await emailService.sendInactiveUserReminder(user);
      
      if (emailResult.success) {
        // Update user record with reminder sent info
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastReminderSent: new Date(),
            reminderCount: { increment: 1 }
          }
        });

        // Log the reminder action
        await prisma.auditLog.create({
          data: {
            actorUserId: actorUserId || await this.getSystemUserId(),
            action: 'INACTIVE_USER_REMINDER_SENT',
            targetType: 'USER',
            targetId: user.id,
            details: `Reminder email sent to inactive user ${user.email}. Reminder count: ${user.reminderCount + 1}`,
            timestamp: new Date()
          }
        });

        return {
          success: true,
          userId: user.id,
          email: user.email,
          messageId: emailResult.messageId,
          reminderCount: user.reminderCount + 1
        };
      } else {
        throw new Error(`Failed to send email: ${emailResult.error}`);
      }
    } catch (error) {
      console.error(`Error sending reminder to user ${user.id}:`, error);
      
      // Log the failed reminder attempt
      await prisma.auditLog.create({
        data: {
          actorUserId: actorUserId || await this.getSystemUserId(),
          action: 'INACTIVE_USER_REMINDER_FAILED',
          targetType: 'USER',
          targetId: user.id,
          details: `Failed to send reminder email to ${user.email}: ${error.message}`,
          timestamp: new Date()
        }
      });

      return {
        success: false,
        userId: user.id,
        email: user.email,
        error: error.message
      };
    }
  }

  async sendRemindersToAllInactiveUsers(actorUserId = null) {
    try {
      const inactiveUsers = await this.findInactiveUsers();
      console.log(`Found ${inactiveUsers.length} inactive users to send reminders to`);

      const results = [];
      for (const user of inactiveUsers) {
        const result = await this.sendReminderToUser(user, actorUserId);
        results.push(result);
        
        // Add a small delay between emails to avoid overwhelming the SMTP server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Reminder campaign completed: ${successful} successful, ${failed} failed`);

      return {
        totalUsers: inactiveUsers.length,
        successful,
        failed,
        results
      };
    } catch (error) {
      console.error('Error in reminder campaign:', error);
      throw error;
    }
  }

  async markUserActive(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          lastReminderSent: true,
          reminderCount: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update last activity
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastActivity: new Date()
        }
      });

      // If user had received reminders, send welcome back email
      if (user.lastReminderSent && user.reminderCount > 0) {
        try {
          await emailService.sendWelcomeBackEmail(user);
          
          // Log the welcome back email
          await prisma.auditLog.create({
            data: {
              actorUserId: await this.getSystemUserId(),
              action: 'WELCOME_BACK_EMAIL_SENT',
              targetType: 'USER',
              targetId: userId,
              details: `Welcome back email sent to ${user.email} after returning from inactivity`,
              timestamp: new Date()
            }
          });
        } catch (emailError) {
          console.error('Error sending welcome back email:', emailError);
        }
      }

      return { success: true, message: 'User marked as active' };
    } catch (error) {
      console.error('Error marking user as active:', error);
      throw error;
    }
  }

  async getInactiveUserStats() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.inactivityThreshold);

      const stats = await prisma.user.groupBy({
        by: ['reminderCount'],
        where: {
          isActive: true,
          OR: [
            { lastActivity: { lt: cutoffDate } },
            { lastActivity: null },
            // Also check lastLogin as fallback if lastActivity is recent but lastLogin is old
            {
              AND: [
                { lastActivity: { gte: cutoffDate } }, // lastActivity is recent
                { lastLogin: { lt: cutoffDate } }      // but lastLogin is old
              ]
            }
          ]
        },
        _count: {
          id: true
        }
      });

      const totalInactive = await prisma.user.count({
        where: {
          isActive: true,
          OR: [
            { lastActivity: { lt: cutoffDate } },
            { lastActivity: null },
            // Also check lastLogin as fallback if lastActivity is recent but lastLogin is old
            {
              AND: [
                { lastActivity: { gte: cutoffDate } }, // lastActivity is recent
                { lastLogin: { lt: cutoffDate } }      // but lastLogin is old
              ]
            }
          ]
        }
      });

      const usersWithReminders = await prisma.user.count({
        where: {
          isActive: true,
          reminderCount: { gt: 0 }
        }
      });

      return {
        totalInactive,
        usersWithReminders,
        reminderBreakdown: stats,
        inactivityThreshold: this.inactivityThreshold,
        maxReminders: this.maxReminders
      };
    } catch (error) {
      console.error('Error getting inactive user stats:', error);
      throw error;
    }
  }

  async resetUserReminders(userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastReminderSent: null,
          reminderCount: 0
        }
      });

      // Log the reset action
      await prisma.auditLog.create({
        data: {
          actorUserId: await this.getSystemUserId(),
          action: 'USER_REMINDERS_RESET',
          targetType: 'USER',
          targetId: userId,
          details: 'User reminder count and last reminder sent date reset',
          timestamp: new Date()
        }
      });

      return { success: true, message: 'User reminders reset successfully' };
    } catch (error) {
      console.error('Error resetting user reminders:', error);
      throw error;
    }
  }
}

module.exports = new InactiveUserService();
