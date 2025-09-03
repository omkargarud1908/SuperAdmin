# Email Reminder System Setup Guide

This guide explains how to set up and configure the SMTP-based email reminder system for inactive users.

## Prerequisites

- Node.js and npm installed
- PostgreSQL database running
- SMTP server credentials (Gmail, SendGrid, etc.)

## Installation

The required packages have already been installed:
- `nodemailer` - For sending emails via SMTP
- `node-cron` - For scheduling automated email campaigns

## Environment Variables

Create a `.env` file in the Backend directory with the following variables:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000

# Email Reminder Configuration
INACTIVITY_THRESHOLD_DAYS=7
MAX_REMINDERS=3
REMINDER_INTERVAL_DAYS=7

# Timezone for cron jobs (optional)
TZ=UTC
```

## SMTP Configuration Examples

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Note:** For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password instead of your regular password

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Outlook/Office 365
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## Database Migration

After setting up the environment variables, run the database migration:

```bash
npm run db:push
```

This will add the new fields to the User model:
- `lastActivity` - Tracks when the user was last active
- `lastReminderSent` - Tracks when the last reminder was sent
- `reminderCount` - Tracks how many reminders have been sent

## Features

### Automatic Email Reminders
- **Daily Check**: Runs at 9:00 AM every day
- **Smart Targeting**: Only sends reminders to users who haven't received them recently
- **Rate Limiting**: Maximum of 3 reminders per user
- **Interval Control**: 7-day minimum interval between reminders

### Email Templates
- **Reminder Email**: Sent to inactive users with a call-to-action
- **Welcome Back Email**: Sent when users return after receiving reminders
- **Responsive Design**: HTML and plain text versions included

### Manual Controls
- Send reminders to specific users
- Send reminders to all inactive users
- Mark users as active
- Reset user reminder counters
- Control cron job scheduling

## API Endpoints

### Get Inactive User Statistics
```
GET /api/v1/superadmin/email-reminders/stats
```

### Get List of Inactive Users
```
GET /api/v1/superadmin/email-reminders/inactive-users
```

### Send Reminder to Specific User
```
POST /api/v1/superadmin/email-reminders/send-reminder/:userId
```

### Send Reminders to All Inactive Users
```
POST /api/v1/superadmin/email-reminders/send-reminders
```

### Mark User as Active
```
PUT /api/v1/superadmin/email-reminders/mark-active/:userId
```

### Reset User Reminders
```
PUT /api/v1/superadmin/email-reminders/reset-reminders/:userId
```

### Cron Job Management
```
GET /api/v1/superadmin/email-reminders/cron-status
POST /api/v1/superadmin/email-reminders/trigger-reminder-job
POST /api/v1/superadmin/email-reminders/trigger-cleanup-job
POST /api/v1/superadmin/email-reminders/restart-cron
POST /api/v1/superadmin/email-reminders/stop-cron
```

## How It Works

1. **User Activity Tracking**: The system tracks user activity through login events
2. **Inactivity Detection**: Users are considered inactive after 30 days (configurable)
3. **Reminder Scheduling**: Daily cron job checks for inactive users
4. **Smart Reminder Logic**: Only sends reminders to users who:
   - Haven't been active recently
   - Haven't received a reminder recently
   - Haven't exceeded the maximum reminder count
5. **Welcome Back**: When users return, they receive a welcome back email

## Customization

### Email Templates
Edit the HTML and text templates in `services/emailService.js` to match your brand.

### Timing Configuration
Adjust the environment variables to change:
- How long before a user is considered inactive
- Maximum number of reminders per user
- Interval between reminders
- When cron jobs run

### Cron Schedule
Modify the cron expressions in `services/cronService.js`:
- Daily reminder check: `