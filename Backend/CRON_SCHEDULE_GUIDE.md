# Cron Schedule Configuration Guide

You can now configure your cron job schedules using environment variables in your `.env` file.

## Environment Variables

Add these variables to your `Backend/.env` file:

```env
# Cron Job Schedules
REMINDER_CRON_SCHEDULE=5 23 * * *
CLEANUP_CRON_SCHEDULE=0 2 * * 0

# Timezone
TZ=Asia/Calcutta
```

## Cron Expression Format

Cron expressions use the format: `minute hour day month day-of-week`

### Examples

#### Daily Reminders
```env
# Every day at 11:05 PM
REMINDER_CRON_SCHEDULE=5 23 * * *

# Every day at 9:00 AM
REMINDER_CRON_SCHEDULE=0 9 * * *

# Every day at 2:30 PM
REMINDER_CRON_SCHEDULE=30 14 * * *

# Every 6 hours
REMINDER_CRON_SCHEDULE=0 */6 * * *
```

#### Weekly Cleanup
```env
# Every Sunday at 2:00 AM
CLEANUP_CRON_SCHEDULE=0 2 * * 0

# Every Monday at 3:00 AM
CLEANUP_CRON_SCHEDULE=0 3 * * 1

# Every Friday at 11:00 PM
CLEANUP_CRON_SCHEDULE=0 23 * * 5
```

#### Custom Schedules
```env
# Every 15 minutes
REMINDER_CRON_SCHEDULE=*/15 * * * *

# Every hour at minute 0
REMINDER_CRON_SCHEDULE=0 * * * *

# Every weekday at 8:00 AM
REMINDER_CRON_SCHEDULE=0 8 * * 1-5

# First day of every month at midnight
CLEANUP_CRON_SCHEDULE=0 0 1 * *
```

## Day of Week Reference

- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

## Timezone

Make sure to set your timezone:

```env
# For India
TZ=Asia/Calcutta

# For US Eastern
TZ=America/New_York

# For UTC
TZ=UTC
```

## Default Values

If you don't set these environment variables, the system will use these defaults:

- `REMINDER_CRON_SCHEDULE`: `5 23 * * *` (11:05 PM daily)
- `CLEANUP_CRON_SCHEDULE`: `0 2 * * 0` (2:00 AM on Sundays)
- `TZ`: `Asia/Calcutta`

## Testing Your Schedule

After updating your `.env` file:

1. **Restart your server** to load the new environment variables
2. **Check the cron status** in the Email Reminders UI
3. **Use the test job** to verify the schedule works
4. **Monitor the logs** for confirmation

## Example .env Configuration

```env
# Database
DATABASE_URL=your_database_url

# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Reminder Settings
INACTIVITY_THRESHOLD_DAYS=7
MAX_REMINDERS=3
REMINDER_INTERVAL_DAYS=1

# Cron Schedules
REMINDER_CRON_SCHEDULE=5 23 * * *
CLEANUP_CRON_SCHEDULE=0 2 * * 0

# Timezone
TZ=Asia/Calcutta
```

## Important Notes

- **Restart Required**: You must restart your server after changing these environment variables
- **Timezone Matters**: All schedules are relative to your configured timezone
- **Testing**: Use the test job feature to verify your schedule works before relying on it
- **Logs**: Check server logs to confirm jobs are running at the expected times
