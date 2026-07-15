/**
 * Email Service
 * Handles sending verification and notification emails
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter based on environment
const createTransporter = () => {
  // Use SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Ethereal for testing (emails are captured, not sent)
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('SMTP not configured. Emails will be logged but not sent.');
    return null;
  }

  throw new Error('SMTP configuration is required in production');
};

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (email, name, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Inovitaz" <noreply@inovitaz.com>',
    to: email,
    subject: 'Verify your Inovitaz account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Inovitaz!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for signing up for Inovitaz. Please verify your email address to complete your registration.</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with Inovitaz, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Inovitaz. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  const transport = getTransporter();

  if (!transport) {
    // Log the email instead of sending (development mode)
    logger.info('📧 VERIFICATION EMAIL (not sent - SMTP not configured)', {
      to: email,
      name,
      verificationLink,
    });
    return { success: true, preview: verificationLink };
  }

  try {
    const info = await transport.sendMail(mailOptions);
    logger.info('✅ Verification email sent', { to: email, messageId: info.messageId });
    
    // If using Ethereal, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info('📧 Email preview URL', { previewUrl });
      }
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('❌ Failed to send verification email', {
      to: email,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
};
