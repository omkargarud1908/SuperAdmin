const cron = require('node-cron');
const inactiveUserService = require('./inactiveUserService');

class CronService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
    this.jobStatus = new Map(); // Track job status manually
  }

  initialize() {
    if (this.isInitialized) {
      console.log('Cron service already initialized');
      return;
    }

    console.log('🚀 Initializing Cron Service...');
    console.log('⏰ Current time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Calcutta' }));
    console.log('🌍 Timezone:', process.env.TZ || 'Asia/Calcutta');

    // Schedule daily reminder check at 11:05 PM
    this.scheduleReminderJob();
    
    // Schedule weekly cleanup and stats at 2:00 AM on Sundays
    this.scheduleCleanupJob();

    this.isInitialized = true;
    console.log('✅ Cron service initialized successfully');
    console.log('📋 Active jobs:', Array.from(this.jobs.keys()));
  }

  scheduleReminderJob() {
    try {
      // Get cron expression from environment variable or use default
      const cronExpression = process.env.REMINDER_CRON_SCHEDULE || '5 23 * * *'; // Default: 11:05 PM daily
      const timezone = process.env.TZ || 'Asia/Calcutta';
      
      console.log(`📅 Scheduling reminder job: ${cronExpression} (${timezone})`);
      
      const job = cron.schedule(cronExpression, async () => {
        const runTime = new Date();
        console.log('🕐 [CRON] Running scheduled inactive user reminder check...');
        this.jobStatus.set('reminder', { 
          lastRun: runTime, 
          status: 'running',
          nextRun: this.getNextExecutionTime(cronExpression)
        });
        
        try {
          const result = await inactiveUserService.sendRemindersToAllInactiveUsers();
          console.log('✅ [CRON] Scheduled reminder job completed:', result);
          this.jobStatus.set('reminder', { 
            lastRun: runTime, 
            status: 'completed',
            nextRun: this.getNextExecutionTime(cronExpression),
            result: result
          });
        } catch (error) {
          console.error('❌ [CRON] Scheduled reminder job failed:', error);
          this.jobStatus.set('reminder', { 
            lastRun: runTime, 
            status: 'failed',
            nextRun: this.getNextExecutionTime(cronExpression),
            error: error.message
          });
        }
      }, {
        scheduled: true,
        timezone: timezone
      });

      // Start the job immediately
      job.start();
      
      // Store job and initial status
      this.jobs.set('reminder', job);
      this.jobStatus.set('reminder', {
        lastRun: null,
        status: 'scheduled',
        nextRun: this.getNextExecutionTime(cronExpression),
        cronExpression: cronExpression,
        timezone: timezone
      });
      
      console.log('✅ Reminder job scheduled and started for 11:05 PM daily');
      console.log('📅 Next execution:', this.getNextExecutionTime(cronExpression));
      
    } catch (error) {
      console.error('❌ Failed to schedule reminder job:', error);
    }
  }

  scheduleCleanupJob() {
    try {
      // Get cron expression from environment variable or use default
      const cronExpression = process.env.CLEANUP_CRON_SCHEDULE || '0 2 * * 0'; // Default: 2:00 AM on Sundays
      const timezone = process.env.TZ || 'Asia/Calcutta';
      
      console.log(`📅 Scheduling cleanup job: ${cronExpression} (${timezone})`);
      
      const job = cron.schedule(cronExpression, async () => {
        console.log('🧹 [CRON] Running scheduled cleanup and stats generation...');
        this.jobStatus.set('cleanup', { 
          lastRun: new Date(), 
          status: 'running',
          nextRun: this.getNextExecutionTime(cronExpression)
        });
        
        try {
          const stats = await inactiveUserService.getInactiveUserStats();
          console.log('📊 [CRON] Weekly inactive user stats:', stats);
          
          // You can add additional cleanup tasks here
          // For example, archiving old audit logs, cleaning up expired sessions, etc.
          
          this.jobStatus.set('cleanup', { 
            lastRun: new Date(), 
            status: 'completed',
            nextRun: this.getNextExecutionTime(cronExpression),
            result: stats
          });
          
        } catch (error) {
          console.error('❌ [CRON] Scheduled cleanup job failed:', error);
          this.jobStatus.set('cleanup', { 
            lastRun: new Date(), 
            status: 'failed',
            nextRun: this.getNextExecutionTime(cronExpression),
            error: error.message
          });
        }
      }, {
        scheduled: true,
        timezone: timezone
      });

      // Start the job immediately
      job.start();
      
      // Store job and initial status
      this.jobs.set('cleanup', job);
      this.jobStatus.set('cleanup', {
        lastRun: null,
        status: 'scheduled',
        nextRun: this.getNextExecutionTime(cronExpression),
        cronExpression: cronExpression,
        timezone: timezone
      });
      
      console.log('✅ Cleanup job scheduled and started for 2:00 AM on Sundays');
      console.log('📅 Next execution:', this.getNextExecutionTime(cronExpression));
      
    } catch (error) {
      console.error('❌ Failed to schedule cleanup job:', error);
    }
  }

  // Method to manually trigger reminder job
  async triggerReminderJob() {
    console.log('Manually triggering reminder job...');
    try {
      const result = await inactiveUserService.sendRemindersToAllInactiveUsers();
      console.log('Manual reminder job completed:', result);
      return result;
    } catch (error) {
      console.error('Manual reminder job failed:', error);
      throw error;
    }
  }

  // Method to manually trigger cleanup job
  async triggerCleanupJob() {
    console.log('Manually triggering cleanup job...');
    try {
      const stats = await inactiveUserService.getInactiveUserStats();
      console.log('Manual cleanup job completed:', stats);
      return stats;
    } catch (error) {
      console.error('Manual cleanup job failed:', error);
      throw error;
    }
  }

  // Get status of all cron jobs
  getJobStatus() {
    const status = {
      initialized: this.isInitialized,
      timezone: process.env.TZ || 'Asia/Calcutta',
      currentTime: new Date().toISOString(),
      currentTimeLocal: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Calcutta' }),
      jobs: {}
    };

    // Use our manual status tracking instead of unreliable node-cron properties
    for (const [name, job] of this.jobs) {
      const manualStatus = this.jobStatus.get(name) || {};
      
      const jobStatus = {
        // Manual tracking (reliable)
        status: manualStatus.status || 'unknown',
        lastRun: manualStatus.lastRun || null,
        nextRun: manualStatus.nextRun || null,
        cronExpression: manualStatus.cronExpression || null,
        timezone: manualStatus.timezone || null,
        error: manualStatus.error || null,
        result: manualStatus.result || null,
        
        // Node-cron properties (unreliable but included for reference)
        nodeCronRunning: job.running || false,
        nodeCronScheduled: job.scheduled || false,
        
        // Job descriptions
        description: this.getJobDescription(name)
      };

      status.jobs[name] = jobStatus;
    }

    return status;
  }

  // Get job description
  getJobDescription(jobName) {
    const descriptions = {
      'reminder': `Daily inactive user reminder emails (${process.env.REMINDER_CRON_SCHEDULE || '5 23 * * *'})`,
      'cleanup': `Weekly cleanup and stats generation (${process.env.CLEANUP_CRON_SCHEDULE || '0 2 * * 0'})`,
      'test': 'Test job for verification (runs every minute)'
    };
    return descriptions[jobName] || 'Unknown job';
  }

  // Stop all cron jobs
  stopAllJobs() {
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    }
    this.jobs.clear();
    this.isInitialized = false;
  }

  // Stop a specific cron job
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      console.log(`Stopped cron job: ${jobName}`);
      return true;
    }
    return false;
  }

  // Restart all cron jobs
  restart() {
    this.stopAllJobs();
    this.initialize();
  }

  // Update last run times from audit logs
  async updateLastRunFromAuditLogs() {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Get the most recent reminder activity
      const lastReminder = await prisma.auditLog.findFirst({
        where: {
          action: 'INACTIVE_USER_REMINDER_SENT'
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      if (lastReminder) {
        this.jobStatus.set('reminder', {
          ...this.jobStatus.get('reminder'),
          lastRun: lastReminder.timestamp,
          status: 'completed'
        });
        console.log(`📅 Updated reminder last run from audit log: ${lastReminder.timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Calcutta' })}`);
      }

      await prisma.$disconnect();
    } catch (error) {
      console.error('Error updating last run from audit logs:', error);
    }
  }

  // Helper method to calculate next execution time
  getNextExecutionTime(cronExpression) {
    try {
      // Validate cron expression first
      if (!cronExpression || typeof cronExpression !== 'string') {
        return 'Invalid cron expression';
      }

      // Check if cron-parser is available
      try {
        const cronParser = require('cron-parser');
        const interval = cronParser.parseExpression(cronExpression, {
          tz: process.env.TZ || 'Asia/Calcutta'
        });
        const nextRun = interval.next();
        return nextRun.toLocaleString('en-IN', { timeZone: 'Asia/Calcutta' });
      } catch (parserError) {
        console.log('Cron-parser not available, using fallback calculation');
        return this.calculateNextRunFallback(cronExpression);
      }
    } catch (error) {
      console.error('Error calculating next execution time:', error);
      return this.calculateNextRunFallback(cronExpression);
    }
  }

  // Fallback calculation method
  calculateNextRunFallback(cronExpression) {
    try {
      const parts = cronExpression.split(' ');
      if (parts.length !== 5) {
        return 'Invalid cron format';
      }

      const [minute, hour, day, month, dayOfWeek] = parts;
      const now = new Date();
      const timezone = process.env.TZ || 'Asia/Calcutta';

      // Handle daily patterns (minute hour * * *)
      if (day === '*' && month === '*' && dayOfWeek === '*') {
        const nextRun = new Date();
        nextRun.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        
        return nextRun.toLocaleString('en-IN', { timeZone: timezone });
      }

      // Handle weekly patterns (minute hour * * dayOfWeek)
      if (day === '*' && month === '*') {
        const targetDay = parseInt(dayOfWeek) || 0;
        const nextRun = new Date();
        nextRun.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);
        
        // Find next occurrence of target day
        const daysUntilTarget = (targetDay - nextRun.getDay() + 7) % 7;
        if (daysUntilTarget === 0 && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        }
        
        return nextRun.toLocaleString('en-IN', { timeZone: timezone });
      }

      // Default fallback
      return 'Complex schedule - check logs';
    } catch (error) {
      console.error('Fallback calculation error:', error);
      return 'Unable to calculate';
    }
  }

  // Method to schedule a test job (runs every minute for testing)
  scheduleTestJob() {
    try {
      const cronExpression = '* * * * *'; // Every minute
      const timezone = process.env.TZ || 'Asia/Calcutta';
      
      console.log(`🧪 Scheduling test job: ${cronExpression} (${timezone})`);
      
      const job = cron.schedule(cronExpression, async () => {
        console.log('🧪 [TEST] Test job running at:', new Date().toISOString());
        this.jobStatus.set('test', { 
          lastRun: new Date(), 
          status: 'running',
          nextRun: this.getNextExecutionTime(cronExpression)
        });
        
        try {
          const result = await inactiveUserService.sendRemindersToAllInactiveUsers();
          console.log('✅ [TEST] Test job completed:', result);
          this.jobStatus.set('test', { 
            lastRun: new Date(), 
            status: 'completed',
            nextRun: this.getNextExecutionTime(cronExpression),
            result: result
          });
        } catch (error) {
          console.error('❌ [TEST] Test job failed:', error);
          this.jobStatus.set('test', { 
            lastRun: new Date(), 
            status: 'failed',
            nextRun: this.getNextExecutionTime(cronExpression),
            error: error.message
          });
        }
      }, {
        scheduled: true,
        timezone: timezone
      });

      // Start the test job immediately
      job.start();
      
      // Store job and initial status
      this.jobs.set('test', job);
      this.jobStatus.set('test', {
        lastRun: null,
        status: 'scheduled',
        nextRun: this.getNextExecutionTime(cronExpression),
        cronExpression: cronExpression,
        timezone: timezone
      });
      
      console.log('🧪 Test job scheduled and started - will run every minute');
      console.log('📅 Next execution:', this.getNextExecutionTime(cronExpression));
      
      return job;
      
    } catch (error) {
      console.error('❌ Failed to schedule test job:', error);
      throw error;
    }
  }

  // Stop test job
  stopTestJob() {
    const job = this.jobs.get('test');
    if (job) {
      job.stop();
      this.jobs.delete('test');
      console.log('🛑 Test job stopped');
      return true;
    }
    return false;
  }
}

module.exports = new CronService();
