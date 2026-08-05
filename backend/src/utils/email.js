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
      // Fail fast instead of hanging on a slow/unreachable SMTP server.
      connectionTimeout: 10000,  // 10s to establish the connection
      greetingTimeout: 10000,    // 10s for the SMTP greeting
      socketTimeout: 15000,      // 15s of inactivity
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
 * Modern, high-contrast, email-client-safe HTML shell.
 * Uses a dark outer canvas + white card, a gradient header (with solid
 * fallback for Outlook), a prominent CTA button, and a MASKED fallback
 * link (so the raw token URL is never shown in the visible text).
 *
 * Table-based + inline styles only (max compatibility across clients).
 */
const buildEmailHtml = ({ heading, name, intro = [], ctaText, ctaLink, fallbackAnchorText, note }) => {
  const year = new Date().getFullYear();
  const introHtml = intro
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#475569;">${p}</p>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1022;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1022;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.45);">

          <!-- Brand header -->
          <tr>
            <td style="background-color:#1d4ed8;background-image:linear-gradient(135deg,#1d4ed8 0%,#4f46e5 100%);padding:36px 32px;text-align:center;">
              <div style="font-size:26px;font-weight:700;color:#ffffff;letter-spacing:.5px;">InovitaZ</div>
              <div style="margin-top:8px;font-size:12px;color:#c7d2fe;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">IoT Projects &amp; Tutorials</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 36px;background-color:#ffffff;">
              <h1 style="margin:0 0 18px 0;font-size:24px;line-height:1.3;font-weight:700;color:#0f172a;">${heading}</h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#475569;">Hi ${name},</p>
              ${introHtml}

              <!-- CTA button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 10px 0;">
                <tr>
                  <td align="center">
                    <a href="${ctaLink}" target="_blank" rel="noopener noreferrer"
                       style="display:inline-block;background-color:#2563eb;background-image:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:15px 44px;border-radius:10px;box-shadow:0 6px 18px rgba(37,99,235,0.35);">
                       ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Masked fallback link (no raw URL shown) -->
              <p style="margin:14px 0 0 0;font-size:14px;line-height:1.6;color:#64748b;text-align:center;">
                If the button doesn't work, <a href="${ctaLink}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600;text-decoration:none;">${fallbackAnchorText}</a>.
              </p>

              ${note ? `<p style="margin:22px 0 0 0;font-size:13px;line-height:1.55;color:#94a3b8;text-align:center;">${note}</p>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 32px;background-color:#0f172a;text-align:center;border-radius:0 0 16px 16px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; ${year} InovitaZ &middot; All rights reserved</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (email, name, token, { isResend = false } = {}) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Inovitaz" <noreply@inovitaz.com>',
    to: email,
    subject: isResend ? 'Reminder: verify your InovitaZ email' : 'Verify your Inovitaz account',
    html: buildEmailHtml({
      heading: 'Verify your email address',
      name,
      intro: isResend
        ? ['Just a friendly reminder — confirm your email address to activate your InovitaZ account and start exploring premium IoT projects.']
        : ['Welcome to <strong style="color:#0f172a;">InovitaZ</strong>! Confirm your email address to activate your account and start exploring premium IoT projects.'],
      ctaText: 'Verify email address',
      ctaLink: verificationLink,
      fallbackAnchorText: 'click here to verify your email',
      note: "This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.",
    }),
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

/**
 * Send password-reset email
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Inovitaz" <noreply@inovitaz.com>',
    to: email,
    subject: 'Reset your Inovitaz password',
    html: buildEmailHtml({
      heading: 'Reset your password',
      name,
      intro: [
        'We received a request to reset the password for your InovitaZ account. Click the button below to choose a new password.',
      ],
      ctaText: 'Reset password',
      ctaLink: resetLink,
      fallbackAnchorText: 'click here to reset your password',
      note: "This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email — your password will not be changed.",
    }),
  };

  const transport = getTransporter();

  if (!transport) {
    logger.info('📧 PASSWORD RESET EMAIL (not sent - SMTP not configured)', {
      to: email,
      name,
      resetLink,
    });
    return { success: true, preview: resetLink };
  }

  try {
    const info = await transport.sendMail(mailOptions);
    logger.info('✅ Password reset email sent', { to: email, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('❌ Failed to send password reset email', {
      to: email,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
