const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const db = require('../config/db');
const { generateToken } = require('../middlewares/auth.middleware');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    const existingUsers = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users (email, password, name, role, created_at)
       VALUES ($1, $2, $3, 'user', NOW())
       RETURNING id`,
      [email.toLowerCase(), hashedPassword, name]
    );

    const newUser = {
      id: result[0].id,
      email: email.toLowerCase(),
      name,
      role: 'user'
    };

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: newUser, token }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const users = await db.query(
      'SELECT id, email, password, name, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({ success: true, data: user[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    await db.query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
      [name, req.user.id]
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const users = await db.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    const token = generateToken({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: { token }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
