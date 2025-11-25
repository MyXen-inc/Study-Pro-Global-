const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: (userName) => ({
    subject: 'Welcome to Study Pro Global!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Study Pro Global!</h1>
        <p>Dear ${userName},</p>
        <p>Thank you for registering with Study Pro Global. We're excited to help you on your journey to international education!</p>
        <p>With your account, you can:</p>
        <ul>
          <li>Search universities worldwide</li>
          <li>Apply to up to 3 universities for free</li>
          <li>Access AI-powered support 24/7</li>
          <li>View scholarship opportunities</li>
        </ul>
        <p>Get started by exploring our university database and finding the perfect match for your academic goals.</p>
        <a href="https://www.studyproglobal.com.bd" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Explore Universities</a>
        <p style="margin-top: 24px;">Best regards,<br>The Study Pro Global Team</p>
      </div>
    `
  }),

  passwordReset: (userName, resetLink) => ({
    subject: 'Password Reset Request - Study Pro Global',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>Dear ${userName},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        <p style="margin-top: 24px;">Best regards,<br>The Study Pro Global Team</p>
      </div>
    `
  }),

  applicationSubmitted: (userName, universityName, programName) => ({
    subject: 'Application Submitted Successfully - Study Pro Global',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Application Submitted!</h1>
        <p>Dear ${userName},</p>
        <p>Your application has been successfully submitted!</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>University:</strong> ${universityName}</p>
          <p><strong>Program:</strong> ${programName}</p>
          <p><strong>Status:</strong> Pending Review</p>
        </div>
        <p>We will notify you when there are updates to your application status.</p>
        <a href="https://www.studyproglobal.com.bd/dashboard" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Application</a>
        <p style="margin-top: 24px;">Best regards,<br>The Study Pro Global Team</p>
      </div>
    `
  }),

  subscriptionActivated: (userName, planName, expiresAt) => ({
    subject: 'Subscription Activated - Study Pro Global',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Subscription Activated!</h1>
        <p>Dear ${userName},</p>
        <p>Your subscription has been successfully activated!</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Valid Until:</strong> ${expiresAt}</p>
        </div>
        <p>You now have access to all premium features. Start exploring universities worldwide!</p>
        <a href="https://www.studyproglobal.com.bd/universities" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Explore Universities</a>
        <p style="margin-top: 24px;">Best regards,<br>The Study Pro Global Team</p>
      </div>
    `
  }),

  consultationBooked: (userName, consultationType, scheduledAt) => ({
    subject: 'Consultation Booked - Study Pro Global',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Consultation Booked!</h1>
        <p>Dear ${userName},</p>
        <p>Your consultation has been successfully scheduled!</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Type:</strong> ${consultationType}</p>
          <p><strong>Scheduled:</strong> ${scheduledAt}</p>
        </div>
        <p>You will receive a meeting link before the scheduled time.</p>
        <a href="https://www.studyproglobal.com.bd/dashboard" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Consultations</a>
        <p style="margin-top: 24px;">Best regards,<br>The Study Pro Global Team</p>
      </div>
    `
  })
};

/**
 * Send email
 * @param {string} to - Recipient email address
 * @param {string} templateName - Name of the email template
 * @param {object} data - Data to pass to the template
 * @returns {Promise<object>} - Result of sending email
 */
const sendEmail = async (to, templateName, data = {}) => {
  // Check if email notifications are enabled
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
    console.log('Email notifications are disabled');
    return { success: true, message: 'Email notifications disabled' };
  }

  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('SMTP not configured');
    return { success: false, message: 'SMTP not configured' };
  }

  try {
    const transporter = createTransporter();

    // Get template
    let template;
    switch (templateName) {
      case 'welcome':
        template = emailTemplates.welcome(data.userName);
        break;
      case 'passwordReset':
        template = emailTemplates.passwordReset(data.userName, data.resetLink);
        break;
      case 'applicationSubmitted':
        template = emailTemplates.applicationSubmitted(data.userName, data.universityName, data.programName);
        break;
      case 'subscriptionActivated':
        template = emailTemplates.subscriptionActivated(data.userName, data.planName, data.expiresAt);
        break;
      case 'consultationBooked':
        template = emailTemplates.consultationBooked(data.userName, data.consultationType, data.scheduledAt);
        break;
      default:
        throw new Error(`Unknown email template: ${templateName}`);
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"Study Pro Global" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send custom email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<object>} - Result of sending email
 */
const sendCustomEmail = async (to, subject, html) => {
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
    console.log('Email notifications are disabled');
    return { success: true, message: 'Email notifications disabled' };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('SMTP not configured');
    return { success: false, message: 'SMTP not configured' };
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"Study Pro Global" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendCustomEmail,
  emailTemplates
};
