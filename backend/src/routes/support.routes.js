/**
 * Support Routes — visitor contact form.
 *
 * POST /api/support/contact  { name, email, subject, message }
 *   -> Brevo-emails the team inbox AND auto-replies to the visitor.
 *   Replaces the old `mailto:` buttons, which were silently forced into
 *   the OS default mail app (Outlook) and lost us half the enquiries.
 *
 * Rate-limited upstream by strictLimiter (mounted in server.js).
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

const SUPPORT_INBOX = process.env.SUPPORT_INBOX || 'support@inovitaz.in';

// Contact-form payloads are user-authored markup — escape before embedding in HTML emails.
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

router.post(
  '/contact',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Please tell us your name.'),
    body('email').isEmail().normalizeEmail().withMessage('Please use a valid email address.'),
    body('subject').trim().isLength({ min: 3, max: 150 }).withMessage('Please give the message a subject.'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('The message needs at least 10 characters.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, subject, message } = req.body;
    logger.info('📬 Support message received', { from: email, subject });

    try {
      await sendEmail({
        to: SUPPORT_INBOX,
        replyTo: { address: email, name },   // admin Reply answers the visitor directly
        devLogLabel: '📬 [SUPPORT] new contact message',
        devLogLink: `${email} — ${subject}`,
        subject: `[Site support] ${subject}`,
        html: `
          <div style="font-family:system-ui,Arial,sans-serif;font-size:14px">
            <h2 style="margin:0 0 12px">New support message</h2>
            <p><b>From:</b> ${esc(name)} &lt;${esc(email)}&gt;</p>
            <p><b>Subject:</b> ${esc(subject)}</p>
            <p style="white-space:pre-wrap;background:#f6f7fb;padding:12px;border-radius:8px">${esc(message)}</p>
            <p style="color:#667085">Reply directly to this email — it answers <b>${esc(email)}</b>.</p>
          </div>`,
      });

      // Auto-reply to the visitor (never fails the request if this leg errors)
      try {
        await sendEmail({
          to: email,
          devLogLabel: '📬 [SUPPORT] auto-reply',
          devLogLink: `${email} — ${subject}`,
          subject: 'We got your message — InovitaZ support',
          html: `
            <div style="font-family:system-ui,Arial,sans-serif;font-size:14px">
              <h2 style="margin:0 0 12px">Thanks, ${esc(name)} 🙌</h2>
              <p>Your message <i>"${esc(subject)}"</i> is with the InovitaZ team.
                 A human replies to every message — usually within 24 hours.</p>
              <p style="color:#667085">If it's urgent (payment, download issues), WhatsApp is fastest:
                 <b>+91 97055 94777</b>.</p>
            </div>`,
        });
      } catch (replyErr) {
        logger.warn('Support auto-reply failed (inbox mail succeeded)', { error: replyErr.message });
      }

      return res.json({
        success: true,
        message: 'Message sent — a human replies within 24 hours.',
      });
    } catch (err) {
      logger.error('Support contact failed', { error: err.message });
      return res.status(500).json({
        success: false,
        message: 'Could not send right now — try WhatsApp or email us directly.',
      });
    }
  }
);

module.exports = router;
