const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const db = require('../config/db');
const { generateToken } = require('../middlewares/auth.middleware');
const { sendVerificationEmail } = require('../utils/email');
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
      // Log the error but don't fail registration
      logger.error('Failed to send verification email', {
        userId: user.id,
        email,
        error: emailError.message,
        stack: emailError.stack,
      });
      // Don't throw - user can request a new verification email later
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
      'SELECT id, email, password, name, role, is_verified FROM users WHERE email = $1',
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
    if (!user.is_verified) {
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

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerification,
};