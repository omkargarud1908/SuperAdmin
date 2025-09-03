# Email Reminder System for SuperAdmin

This project implements a comprehensive SMTP-based email reminder system to re-engage inactive users and bring them back to your SuperAdmin website.

## 🚀 Features

### Core Functionality
- **Automatic User Activity Tracking**: Monitors user login and activity patterns
- **Smart Inactivity Detection**: Identifies users who haven't been active for configurable periods
- **Automated Email Campaigns**: Sends personalized reminder emails at scheduled intervals
- **Welcome Back Emails**: Automatically sends welcome messages when users return
- **Rate Limiting**: Prevents spam by limiting reminders per user
- **Audit Logging**: Tracks all email activities for compliance and monitoring

### Email Templates
- **Professional HTML Design**: Responsive email templates with modern styling
- **Plain Text Fallback**: Ensures compatibility with all email clients
- **Branded Content**: Customizable templates to match your brand
- **Call-to-Action Buttons**: Direct links back to your website

### Management Interface
- **Real-time Statistics**: View inactive user counts and reminder metrics
- **Manual Controls**: Send reminders to specific users or trigger bulk campaigns
- **Cron Job Management**: Monitor and control automated email scheduling
- **User Management**: Mark users as active, reset reminder counters

## 🏗️ Architecture

### Backend Services
```
services/
├── emailService.js          # SMTP configuration and email sending
├── inactiveUserService.js   # User inactivity detection and management
└── cronService.js          # Automated job scheduling
```

### API Endpoints
```
/api/v1/superadmin/email-reminders/
├── GET    /stats              # Inactive user statistics
├── GET    /inactive-users     # List of inactive users
├── POST   /send-reminder/:id  # Send reminder to specific user
├── POST   /send-reminders     # Send reminders to all inactive users
├── PUT    /mark-active/:id    # Mark user as active
├── PUT    /reset-reminders/:id # Reset user reminder counter
├── GET    /cron-status        # Cron job status
├── POST   /trigger-reminder-job # Manually trigger reminder job
├── POST   /trigger-cleanup-job  # Manually trigger cleanup job
├── POST   /restart-cron       # Restart all cron jobs
└── POST   /stop-cron          # Stop all cron jobs
```

### Database Schema Updates
The system adds three new fields to the User model:
- `lastActivity`: Tracks when the user was last active
- `lastReminderSent`: Records when the last reminder was sent
- `reminderCount`: Tracks the number of reminders sent

## 📧 SMTP Configuration

### Environment Variables
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

# Timezone for cron jobs
TZ=UTC
```

### Supported SMTP Providers
- **Gmail**: Requires 2FA and App Password
- **SendGrid**: Use API key as password
- **Outlook/Office 365**: Standard SMTP authentication
- **Custom SMTP**: Any SMTP server with authentication

## ⏰ Scheduling

### Automated Jobs
- **Daily Reminder Check**: 9:00 AM - Identifies and emails inactive users
- **Weekly Cleanup**: 2:00 AM Sundays - Generates statistics and cleanup tasks

### Smart Reminder Logic
1. **Inactivity Detection**: User considered inactive after 30 days (configurable)
2. **Reminder Eligibility**: Only sends to users who:
   - Haven't been active recently
   - Haven't received a reminder recently (7-day minimum interval)
   - Haven't exceeded maximum reminder count (3 by default)
3. **Rate Limiting**: Prevents email spam and respects user preferences

## 🎨 Email Templates

### Reminder Email Features
- Personalized greeting with user's name
- Highlight key features they're missing
- Clear call-to-action button
- Professional branding and styling
- Mobile-responsive design

### Welcome Back Email Features
- Celebration of user's return
- Summary of new features and improvements
- Encouragement to explore the platform
- Professional and welcoming tone

## 🔧 Installation & Setup

### 1. Install Dependencies
```bash
cd Backend
npm install nodemailer node-cron
```

### 2. Configure Environment
Create `.env` file with SMTP credentials and configuration

### 3. Update Database
```bash
npm run db:push
```

### 4. Start Server
```bash
npm start
```

### 5. Test Configuration
```bash
node test-email.js
```

## 🧪 Testing

### Test Email Service
```bash
# Set test email in environment
TEST_EMAIL=your-test-email@example.com

# Run test script
node test-email.js
```

### Manual API Testing
Use the provided Postman collection or test endpoints directly:
```bash
# Get inactive user stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/v1/superadmin/email-reminders/stats

# Send test reminder
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/v1/superadmin/email-reminders/send-reminder/USER_ID
```

## 📱 Frontend Integration

### New Component
- **EmailReminders.js**: Complete management interface
- **EmailReminders.css**: Responsive styling
- **Navigation**: Added to main navbar and dashboard

### Features
- Real-time statistics display
- Inactive user management table
- Cron job status monitoring
- Manual trigger controls
- Responsive design for all devices

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication required for all endpoints
- Role-based access control (superadmin/admin)
- Secure SMTP connections with TLS/SSL

### Rate Limiting
- Maximum reminders per user (configurable)
- Minimum interval between reminders
- Audit logging for all actions

### Data Protection
- Environment variables for sensitive data
- Secure database connections
- Input validation and sanitization

## 📊 Monitoring & Analytics

### Audit Logging
All email activities are logged with:
- User identification
- Action type and timestamp
- Success/failure status
- Error details for troubleshooting

### Performance Metrics
- Email delivery success rates
- User engagement tracking
- Reminder effectiveness analysis
- System performance monitoring

## 🚨 Troubleshooting

### Common Issues

#### SMTP Connection Failed
```bash
# Check environment variables
echo $SMTP_HOST
echo $SMTP_USER
echo $SMTP_PASS

# Verify SMTP credentials
# Test with telnet or online SMTP testers
```

#### Emails Not Sending
- Verify SMTP configuration
- Check firewall settings
- Review server logs for errors
- Test with simple email client

#### Cron Jobs Not Running
- Verify timezone settings
- Check server time synchronization
- Review cron service logs
- Restart cron service manually

### Debug Mode
Enable detailed logging by setting environment variables:
```env
DEBUG=email-reminders:*
LOG_LEVEL=debug
```

## 🔄 Maintenance

### Regular Tasks
- Monitor email delivery rates
- Review inactive user statistics
- Update email templates as needed
- Clean up old audit logs

### Performance Optimization
- Adjust reminder intervals based on user behavior
- Optimize database queries for large user bases
- Implement email queuing for high-volume scenarios

## 📈 Future Enhancements

### Planned Features
- **A/B Testing**: Test different email templates
- **User Segmentation**: Target specific user groups
- **Advanced Analytics**: Detailed engagement metrics
- **Email Templates**: Drag-and-drop template builder
- **Integration APIs**: Connect with marketing tools

### Scalability Improvements
- **Queue System**: Redis-based email queuing
- **Microservices**: Separate email service deployment
- **Load Balancing**: Multiple SMTP providers
- **Caching**: Redis caching for user data

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

### Code Standards
- Follow existing code style
- Add comprehensive tests
- Update documentation
- Include error handling

## 📄 License

This project is licensed under the ISC License. See LICENSE file for details.

## 🆘 Support

### Getting Help
1. Check the troubleshooting section
2. Review server logs and error messages
3. Test SMTP configuration independently
4. Consult the setup documentation

### Contact Information
- Create GitHub issue for bugs
- Submit feature requests via issues
- Check existing documentation first

---

**Note**: This system is designed for production use but should be thoroughly tested in a staging environment before deployment. Monitor email delivery rates and user engagement metrics to optimize performance.
