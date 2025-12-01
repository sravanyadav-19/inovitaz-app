const db = require('../config/db');

/**
 * Create a new project (Admin only)
 * POST /api/admin/projects
 */
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      thumbnail,
      content_url,
      category,
      features,
      tech_stack
    } = req.body;

    const result = await db.query(
      `INSERT INTO projects 
       (title, description, price, thumbnail, content_url, category, features, tech_stack, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title,
        description,
        price,
        thumbnail,
        content_url,
        category || 'IoT',
        JSON.stringify(features || []),
        JSON.stringify(tech_stack || [])
      ]
    );

    const newProject = await db.query(
      'SELECT * FROM projects WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject[0]
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
};

/**
 * Update a project (Admin only)
 * PUT /api/admin/projects/:id
 */
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      thumbnail,
      content_url,
      category,
      features,
      tech_stack
    } = req.body;

    // Check if project exists
    const existingProjects = await db.query(
      'SELECT id FROM projects WHERE id = ?',
      [id]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (thumbnail !== undefined) {
      updates.push('thumbnail = ?');
      params.push(thumbnail);
    }
    if (content_url !== undefined) {
      updates.push('content_url = ?');
      params.push(content_url);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (features !== undefined) {
      updates.push('features = ?');
      params.push(JSON.stringify(features));
    }
    if (tech_stack !== undefined) {
      updates.push('tech_stack = ?');
      params.push(JSON.stringify(tech_stack));
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedProject = await db.query(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
};

/**
 * Delete a project (Admin only)
 * DELETE /api/admin/projects/:id
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const existingProjects = await db.query(
      'SELECT id FROM projects WHERE id = ?',
      [id]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if there are any paid orders for this project
    const paidOrders = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE project_id = ? AND status = 'paid'`,
      [id]
    );

    if (paidOrders[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete project with existing paid orders. Consider archiving instead.'
      });
    }

    // Delete pending orders first
    await db.query(
      'DELETE FROM orders WHERE project_id = ? AND status != ?',
      [id, 'paid']
    );

    // Delete the project
    await db.query('DELETE FROM projects WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
};

/**
 * Get all orders (Admin only)
 * GET /api/admin/orders
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let sql = `
      SELECT 
        o.*,
        u.email as user_email,
        u.name as user_name,
        p.title as project_title
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN projects p ON o.project_id = p.id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const orders = await db.query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM orders';
    if (status) {
      countSql += ' WHERE status = ?';
    }
    const countResult = await db.query(countSql, status ? [status] : []);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Get dashboard stats (Admin only)
 * GET /api/admin/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const usersResult = await db.query(
      'SELECT COUNT(*) as total FROM users WHERE role = ?',
      ['user']
    );

    // Total projects
    const projectsResult = await db.query(
      'SELECT COUNT(*) as total FROM projects'
    );

    // Total revenue
    const revenueResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'paid'`
    );

    // Total orders
    const ordersResult = await db.query(
      `SELECT COUNT(*) as total FROM orders WHERE status = 'paid'`
    );

    // Recent orders
    const recentOrders = await db.query(
      `SELECT 
        o.*,
        u.email as user_email,
        p.title as project_title
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN projects p ON o.project_id = p.id
       WHERE o.status = 'paid'
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    // Monthly revenue (last 6 months)
    const monthlyRevenue = await db.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(amount) as revenue,
        COUNT(*) as orders
       FROM orders 
       WHERE status = 'paid' 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
    );

    res.json({
      success: true,
      data: {
        totalUsers: usersResult[0].total,
        totalProjects: projectsResult[0].total,
        totalRevenue: revenueResult[0].total,
        totalOrders: ordersResult[0].total,
        recentOrders,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
};

/**
 * Get all users (Admin only)
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const users = await db.query(
      `SELECT id, email, name, role, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    const countResult = await db.query('SELECT COUNT(*) as total FROM users');

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

module.exports = {
  createProject,
  updateProject,
  deleteProject,
  getAllOrders,
  getDashboardStats,
  getAllUsers
};