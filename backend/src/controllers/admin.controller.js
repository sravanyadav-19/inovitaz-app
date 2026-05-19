const db = require('../config/db');
const logger = require('../utils/logger');

const ALLOWED_PROJECT_FIELDS = [
  'title', 'description', 'price', 'thumbnail', 'content_url',
  'category', 'difficulty', 'features', 'tech_stack'
];

const createProject = async (req, res) => {
  try {
    const {
      title, description, price, thumbnail, content_url,
      category, difficulty, features, tech_stack
    } = req.body;

    const result = await db.query(
      `INSERT INTO projects
       (title, description, price, thumbnail, content_url,
        category, difficulty, features, tech_stack, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
       RETURNING id`,
      [
        title, description, price,
        thumbnail || null, content_url || null,
        category || 'IoT', difficulty || 'Beginner',
        JSON.stringify(features || []),
        JSON.stringify(tech_stack || [])
      ]
    );

    const newProject = await db.query(
      'SELECT * FROM projects WHERE id = $1',
      [result[0].id]
    );

    logger.admin('Project created', req.user.id, 'project', result[0].id);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject[0]
    });
  } catch (error) {
    logger.error('Create project error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProjects = await db.query(
      'SELECT id FROM projects WHERE id = $1', [id]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    for (const field of ALLOWED_PROJECT_FIELDS) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        if (field === 'features' || field === 'tech_stack') {
          params.push(JSON.stringify(req.body[field]));
        } else {
          params.push(req.body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    await db.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    const updatedProject = await db.query(
      'SELECT * FROM projects WHERE id = $1', [id]
    );

    logger.admin('Project updated', req.user.id, 'project', id);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject[0]
    });
  } catch (error) {
    logger.error('Update project error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProjects = await db.query(
      'SELECT id FROM projects WHERE id = $1', [id]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const paidOrders = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE project_id = $1 AND status = 'paid'`,
      [id]
    );

    if (parseInt(paidOrders[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete project with existing paid orders.'
      });
    }

    await db.query(
      `DELETE FROM orders WHERE project_id = $1 AND status != 'paid'`, [id]
    );

    await db.query('DELETE FROM projects WHERE id = $1', [id]);

    logger.admin('Project deleted', req.user.id, 'project', id);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Delete project error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let paramIndex = 1;
    const params = [];
    let sql = `
      SELECT
        o.*, u.email as user_email,
        u.name as user_name, p.title as project_title
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN projects p ON o.project_id = p.id
    `;

    if (status) {
      sql += ` WHERE o.status = $${paramIndex++}`;
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);

    const orders = await db.query(sql, params);

    let countSql = 'SELECT COUNT(*) as total FROM orders';
    if (status) countSql += ' WHERE status = $1';
    const countResult = await db.query(countSql, status ? [status] : []);
    const total = parseInt(countResult[0].total);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get all orders error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const usersResult = await db.query(
      `SELECT COUNT(*) as total FROM users WHERE role = 'user'`
    );
    const projectsResult = await db.query(
      'SELECT COUNT(*) as total FROM projects'
    );
    const revenueResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'paid'`
    );
    const ordersResult = await db.query(
      `SELECT COUNT(*) as total FROM orders WHERE status = 'paid'`
    );
    const recentOrders = await db.query(
      `SELECT o.*, u.email as user_email, p.title as project_title
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN projects p ON o.project_id = p.id
       WHERE o.status = 'paid'
       ORDER BY o.created_at DESC
       LIMIT 5`
    );
    const monthlyRevenue = await db.query(
      `SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        SUM(amount) as revenue,
        COUNT(*) as orders
       FROM orders
       WHERE status = 'paid'
       AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY month ASC`
    );

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(usersResult[0].total),
        totalProjects: parseInt(projectsResult[0].total),
        totalRevenue: parseFloat(revenueResult[0].total),
        totalOrders: parseInt(ordersResult[0].total),
        recentOrders,
        monthlyRevenue
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const users = await db.query(
      `SELECT id, email, name, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    const countResult = await db.query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(countResult[0].total);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get all users error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

module.exports = {
  createProject, updateProject, deleteProject,
  getAllOrders, getDashboardStats, getAllUsers
};
