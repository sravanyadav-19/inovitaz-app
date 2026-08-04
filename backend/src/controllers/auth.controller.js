const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const db = require('../config/db');
const { generateToken } = require('../middlewares/auth.middleware');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const logger = require('../utils/logger');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, name } = req.body;

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await db.query(
      `INSERT INTO users (email, password, name, role, is_verified, verification_token, verification_token_expires, created_at) 
       VALUES ($1, $2, $3, 'user', false, $4, $5, NOW()) RETURNING id, email, name, role`,
      [email, hashedPassword, name, verificationToken, verificationTokenExpires]
    );

    const user = result[0];

    logger.auth('REGISTER', user.id, user.email, true);

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
      logger.info('Verification email sent successfully', { userId: user.id, email });
    } catch (emailError) {
      // Log the error with full details for debugging
      logger.error('Failed to send verification email', {
        userId: user.id,
        email,
        error: emailError.message,
        stack: emailError.stack,
      });
      // Rethrow to make the failure visible in server logs and indicate partial failure
      // User can still request a new verification email later, but we log this prominently
      logger.auth('REGISTRATION_EMAIL_FAILED', user.id, email, false, { reason: emailError.message });
      // Don't fail registration - user can request verification email again
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: { user }
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await db.query(
      'SELECT id, email, password, name, role, is_verified, verification_token, token_version FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if email is verified
    // Only block login for users who were sent a verification email (have a token)
    // Users without a verification_token are existing users pre-email-verification - allow them to log in
    if (!user.is_verified && user.verification_token) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in. Check your inbox for the verification link.' 
      });
    }

    const token = generateToken(user);
    const { password: _, is_verified, ...userWithoutPassword } = user;

    logger.auth('LOGIN', user.id, user.email, true);

    return res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const users = await db.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: users[0] });
  } catch (error) {
    logger.error('Get profile error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    const result = await db.query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role',
      [name, userId]
    );

    return res.json({ success: true, data: result[0] });
  } catch (error) {
    logger.error('Update profile error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const users = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    const isValid = await bcrypt.compare(currentPassword, users[0].password);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedNewPassword, userId]);

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    // Find user with this token
    const users = await db.query(
      'SELECT id, email, name, verification_token_expires, is_verified FROM users WHERE verification_token = $1',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    const user = users[0];

    // Check if already verified
    if (user.is_verified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    // Check if token has expired
    if (new Date() > new Date(user.verification_token_expires)) {
      return res.status(400).json({ success: false, message: 'Verification token has expired. Please request a new one.' });
    }

    // Mark user as verified and clear the token
    await db.query(
      'UPDATE users SET is_verified = true, verification_token = NULL, verification_token_expires = NULL, updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    logger.info('Email verified successfully', { userId: user.id, email: user.email });

    return res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    logger.error('Email verification error', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const users = await db.query(
      'SELECT id, email, name, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal whether email exists or not
      return res.json({ success: true, message: 'If the email exists, a verification link has been sent.' });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.json({ success: true, message: 'Email is already verified. You can log in.' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.query(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2, updated_at = NOW() WHERE id = $3',
      [verificationToken, verificationTokenExpires, user.id]
    );

    // Send verification email
    await sendVerificationEmail(email, user.name, verificationToken);

    logger.info('Verification email resent', { userId: user.id, email });

    return res.json({ success: true, message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    logger.error('Resend verification error', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Failed to resend verification email' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;

    const users = await db.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    // Always respond identically so the endpoint cannot be used to enumerate accounts.
    const genericOk = {
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    };

    if (users.length === 0) {
      return res.json(genericOk);
    }

    const user = users[0];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2, updated_at = NOW() WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
      logger.info('Password reset email sent', { userId: user.id, email: user.email });
    } catch (emailError) {
      // Log prominently but do NOT reveal failure to the client (anti-enumeration).
      logger.error('Failed to send password reset email', {
        userId: user.id,
        email: user.email,
        error: emailError.message,
        stack: emailError.stack,
      });
    }

    return res.json(genericOk);
  } catch (error) {
    logger.error('Forgot password error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    const users = await db.query(
      'SELECT id, reset_password_expires FROM users WHERE reset_password_token = $1',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const user = users[0];

    if (new Date() > new Date(user.reset_password_expires)) {
      return res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Invalidate the token AND bump token_version so all previously-issued
    // JWTs (existing sessions) are rejected on their next request.
    await db.query(
      `UPDATE users
       SET password = $1,
           reset_password_token = NULL,
           reset_password_expires = NULL,
           token_version = token_version + 1,
           updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    logger.auth('PASSWORD_RESET', user.id, null, true);

    return res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};