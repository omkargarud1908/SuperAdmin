const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if SMTP credentials are provided
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️  SMTP credentials not configured. Email service will be disabled.');
      console.log('   Set SMTP_USER and SMTP_PASS environment variables to enable email functionality.');
      this.transporter = null;
      return;
    }

    // Create transporter with SMTP configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP connection error:', error);
        console.log('⚠️  Email service will be disabled due to SMTP connection issues.');
        this.transporter = null;
      } else {
        console.log('✅ SMTP server is ready to send emails');
      }
    });
  }

  async sendInactiveUserReminder(user) {
    try {
      if (!this.transporter) {
        return { 
          success: false, 
          error: 'SMTP not configured. Please set SMTP_USER and SMTP_PASS environment variables.' 
        };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'We Miss You! Come Back to SuperAdmin',
        html: this.generateReminderEmailHTML(user),
        text: this.generateReminderEmailText(user),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Reminder email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending reminder email:', error);
      return { success: false, error: error.message };
    }
  }

  generateReminderEmailHTML(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>We Miss You!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>We Miss You, ${user.name}! 👋</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>It's been a while since we've seen you on SuperAdmin. We hope you're doing well!</p>
            <p>Your account is still active and ready for you to continue managing your super admin tasks. Here's what you might be missing:</p>
            <ul>
              <li>📊 Real-time analytics and insights</li>
              <li>👥 User and role management</li>
              <li>📝 Comprehensive audit logs</li>
              <li>⚙️ Advanced settings and configurations</li>
            </ul>
            <p>Don't miss out on the latest features and improvements we've added!</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Get Back to SuperAdmin</a>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The SuperAdmin Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${user.email} because you haven't been active on SuperAdmin recently.</p>
            <p>If you no longer wish to receive these reminders, please contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateReminderEmailText(user) {
    return `
We Miss You, ${user.name}!

Hello ${user.name},

It's been a while since we've seen you on SuperAdmin. We hope you're doing well!

Your account is still active and ready for you to continue managing your super admin tasks. Here's what you might be missing:

- Real-time analytics and insights
- User and role management
- Comprehensive audit logs
- Advanced settings and configurations

Don't miss out on the latest features and improvements we've added!

Get back to SuperAdmin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}

If you have any questions or need assistance, feel free to reach out to our support team.

Best regards,
The SuperAdmin Team

---
This email was sent to ${user.email} because you haven't been active on SuperAdmin recently.
If you no longer wish to receive these reminders, please contact support.
    `;
  }

  async sendWelcomeBackEmail(user) {
    try {
      if (!this.transporter) {
        return { 
          success: false, 
          error: 'SMTP not configured. Please set SMTP_USER and SMTP_PASS environment variables.' 
        };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Welcome Back to SuperAdmin! 🎉',
        html: this.generateWelcomeBackEmailHTML(user),
        text: this.generateWelcomeBackEmailText(user),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome back email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome back email:', error);
      return { success: false, error: error.message };
    }
  }

  generateWelcomeBackEmailHTML(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome Back!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome Back, ${user.name}! 🎉</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>Great to see you back on SuperAdmin! We're excited to have you return.</p>
            <p>While you were away, we've been working hard to improve your experience:</p>
            <ul>
              <li>🚀 Enhanced performance and security</li>
              <li>📱 Improved mobile responsiveness</li>
              <li>🔍 Better search and filtering capabilities</li>
              <li>📊 New analytics features</li>
            </ul>
            <p>Your account is fully up to date and ready to go!</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Continue to SuperAdmin</a>
            <p>If you need help getting reacquainted with the platform, check out our updated documentation or contact support.</p>
            <p>Welcome back!<br>The SuperAdmin Team</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing SuperAdmin for your administrative needs.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateWelcomeBackEmailText(user) {
    return `
Welcome Back, ${user.name}! 🎉

Hello ${user.name},

Great to see you back on SuperAdmin! We're excited to have you return.

While you were away, we've been working hard to improve your experience:

- Enhanced performance and security
- Improved mobile responsiveness
- Better search and filtering capabilities
- New analytics features

Your account is fully up to date and ready to go!

Continue to SuperAdmin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}

If you need help getting reacquainted with the platform, check out our updated documentation or contact support.

Welcome back!
The SuperAdmin Team

---
Thank you for choosing SuperAdmin for your administrative needs.
    `;
  }
}

module.exports = new EmailService();
