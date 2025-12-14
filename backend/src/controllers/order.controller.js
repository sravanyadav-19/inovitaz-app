const db = require('../config/db');

/**
 * Get user's orders
 * GET /api/orders/my
 */
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let sql = `
      SELECT 
        o.id,
        o.project_id,
        o.razorpay_order_id,
        o.razorpay_payment_id,
        o.amount,
        o.status,
        o.created_at,
        p.title as project_title,
        p.thumbnail as project_thumbnail,
        p.category as project_category
      FROM orders o
      JOIN projects p ON o.project_id = p.id
      WHERE o.user_id = ?
    `;
    const params = [userId];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const orders = await db.query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    const countParams = [userId];
    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }
    const countResult = await db.query(countSql, countParams);

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
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Get user's purchased projects
 * GET /api/orders/purchased
 */
const getPurchasedProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    // Join orders with projects and download_logs
    const projects = await db.query(
      `SELECT 
        p.id,
        p.title,
        p.description,
        p.thumbnail,
        p.category,
        o.created_at as purchased_at,
        o.amount as paid_amount,
        dl.download_count,
        dl.max_downloads,
        dl.expiry_date
       FROM orders o
       JOIN projects p ON o.project_id = p.id
       LEFT JOIN download_logs dl ON o.id = dl.order_id
       WHERE o.user_id = ? AND o.status = 'paid'
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        downloads: projects // Return as 'downloads' array to match frontend
      }
    });
  } catch (error) {
    console.error('Get purchased projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchased projects'
    });
  }
};

/**
 * Get single order details
 * GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const orders = await db.query(
      `SELECT 
        o.*,
        p.title as project_title,
        p.description as project_description,
        p.thumbnail as project_thumbnail,
        p.category as project_category
       FROM orders o
       JOIN projects p ON o.project_id = p.id
       WHERE o.id = ? AND o.user_id = ?`,
      [id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: orders[0]
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

module.exports = {
  getMyOrders,
  getPurchasedProjects,
  getOrderById
};