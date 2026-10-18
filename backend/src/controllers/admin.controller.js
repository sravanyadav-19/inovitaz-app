const db = require('../config/db');
const logger = require('../utils/logger');

const ALLOWED_PROJECT_FIELDS = [
  'title', 'description', 'price', 'thumbnail', 'content_url',
  'category', 'difficulty', 'features', 'tech_stack',
  'status'
];

const PROJECT_STATUSES = ['active', 'maintenance', 'closed'];

const createProject = async (req, res) => {
  try {
    const {
      title, description, price, thumbnail, content_url,
      category, difficulty, features, tech_stack,
      status = 'active'
    } = req.body;
    const safeStatus = PROJECT_STATUSES.includes(status) ? status : 'active';

    const result = await db.query(
      `INSERT INTO projects
       (title, description, price, thumbnail, content_url,
        category, difficulty, features, tech_stack, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
       RETURNING id`,
      [
        title, description, price,
        thumbnail || null, content_url || null,
        category || 'IoT', difficulty || 'Beginner',
        JSON.stringify(features || []),
        JSON.stringify(tech_stack || []),
        safeStatus
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
        if (field === 'status' && !PROJECT_STATUSES.includes(req.body.status)) continue;
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
      `SELECT COUNT(*) AS count
       FROM orders o
       WHERE o.status = 'paid'
         AND (
           o.project_id = $1
           OR EXISTS (
             SELECT 1 FROM order_items oi
             WHERE oi.order_id = o.id AND oi.project_id = $1
           )
         )`,
      [id]
    );

    if (parseInt(paidOrders[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete project with existing paid orders.'
      });
    }

    await db.query(
      `DELETE FROM orders o
       WHERE o.status != 'paid'
         AND (
           o.project_id = $1
           OR EXISTS (
             SELECT 1 FROM order_items oi
             WHERE oi.order_id = o.id AND oi.project_id = $1
           )
         )`,
      [id]
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
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = 'WHERE o.status = $1';
    }

    params.push(safeLimit, offset);
    const orders = await db.query(
      `SELECT
         o.id,
         o.razorpay_order_id,
         o.razorpay_payment_id,
         o.amount,
         o.original_amount,
         o.discount_amount,
         o.coupon_code,
         o.currency,
         o.status,
         o.paid_at,
         o.created_at,
         u.email AS user_email,
         u.name AS user_name,
         COUNT(oi.id)::INTEGER AS item_count,
         COALESCE(STRING_AGG(p.title, ', ' ORDER BY oi.id), 'No projects') AS project_title
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN projects p ON p.id = oi.project_id
       ${where}
       GROUP BY o.id, u.id
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = status ? [status] : [];
    const countWhere = status ? 'WHERE status = $1' : '';
    const countResult = await db.query(`SELECT COUNT(*) AS total FROM orders ${countWhere}`, countParams);
    const total = parseInt(countResult[0]?.total || 0, 10);

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          pages: Math.ceil(total / safeLimit),
        },
      },
    });
  } catch (error) {
    logger.error('Get all orders error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [usersResult, projectsResult, revenueResult, ordersResult, recentOrders, monthlyRevenue] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'user'`),
      db.query('SELECT COUNT(*) AS total FROM projects'),
      db.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'paid'`),
      db.query(`SELECT COUNT(*) AS total FROM orders WHERE status = 'paid'`),
      db.query(
        `SELECT
           o.id,
           o.amount,
           o.created_at,
           u.email AS user_email,
           COUNT(oi.id)::INTEGER AS item_count,
           COALESCE(STRING_AGG(p.title, ', ' ORDER BY oi.id), 'No projects') AS project_title
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN projects p ON p.id = oi.project_id
         WHERE o.status = 'paid'
         GROUP BY o.id, u.id
         ORDER BY o.created_at DESC
         LIMIT 5`
      ),
      db.query(
        `SELECT
           TO_CHAR(created_at, 'YYYY-MM') AS month,
           SUM(amount) AS revenue,
           COUNT(*) AS orders
         FROM orders
         WHERE status = 'paid'
           AND created_at >= NOW() - INTERVAL '6 months'
         GROUP BY TO_CHAR(created_at, 'YYYY-MM')
         ORDER BY month ASC`
      ),
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers: parseInt(usersResult[0]?.total || 0, 10),
        totalProjects: parseInt(projectsResult[0]?.total || 0, 10),
        totalRevenue: Number(revenueResult[0]?.total || 0),
        totalOrders: parseInt(ordersResult[0]?.total || 0, 10),
        recentOrders,
        monthlyRevenue,
      },
    });
  } catch (error) {
    logger.error('Get dashboard stats error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
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
