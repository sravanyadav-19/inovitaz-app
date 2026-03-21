/**
 * Project Controller
 * Handles project listing, details, and secure downloads
 */

const db = require('../config/db');
const logger = require('../utils/logger');
const { generateSignedUrl, verifySignedUrl } = require('../utils/signedUrl');

/**
 * Get all projects (public)
 * GET /api/projects
 */
const getAllProjects = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      sort, 
      page = 1, 
      limit = 12,
      difficulty,
      maxPrice,
      technology
    } = req.query;
    
    let sql = `
      SELECT 
        p.id, p.title, p.description, p.price, p.thumbnail, p.category,
        p.difficulty, p.average_rating, p.reviews_count, p.created_at, p.updated_at
      FROM projects p
      WHERE 1=1
    `;
    const params = [];

    // Filter by category
    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    // Filter by difficulty
    if (difficulty) {
      sql += ' AND p.difficulty = ?';
      params.push(difficulty);
    }

    // Filter by max price
    if (maxPrice && maxPrice !== '999') {
      sql += ' AND p.price <= ?';
      params.push(parseInt(maxPrice));
    }

    // Filter by technology
    if (technology) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.category LIKE ?)';
      params.push(`%${technology}%`, `%${technology}%`, `%${technology}%`);
    }

    // Search
    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY p.price DESC';
        break;
      case 'oldest':
        sql += ' ORDER BY p.created_at ASC';
        break;
      case 'popular':
        sql += ' ORDER BY p.reviews_count DESC, p.average_rating DESC';
        break;
      case 'rating':
        sql += ' ORDER BY p.average_rating DESC, p.reviews_count DESC';
        break;
      case 'newest':
      default:
        sql += ' ORDER BY p.created_at DESC';
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const projects = await db.query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM projects p WHERE 1=1';
    const countParams = [];
    
    if (category) {
      countSql += ' AND p.category = ?';
      countParams.push(category);
    }
    if (difficulty) {
      countSql += ' AND p.difficulty = ?';
      countParams.push(difficulty);
    }
    if (maxPrice && maxPrice !== '999') {
      countSql += ' AND p.price <= ?';
      countParams.push(parseInt(maxPrice));
    }
    if (technology) {
      countSql += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.category LIKE ?)';
      countParams.push(`%${technology}%`, `%${technology}%`, `%${technology}%`);
    }
    if (search) {
      countSql += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.category LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await db.query(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get projects error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
};

/**
 * Get single project by ID (public)
 * GET /api/projects/:id
 */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const projects = await db.query(
      `SELECT 
        id, title, description, price, thumbnail, category,
        difficulty, average_rating, reviews_count,
        features, tech_stack, created_at, updated_at
       FROM projects 
       WHERE id = ?`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];
    
    // Parse JSON fields safely
    try {
      if (typeof project.features === 'string') {
        project.features = JSON.parse(project.features);
      }
    } catch (e) {
      project.features = [];
    }
    
    try {
      if (typeof project.tech_stack === 'string') {
        project.tech_stack = JSON.parse(project.tech_stack);
      }
    } catch (e) {
      project.tech_stack = [];
    }

    // Check if user has purchased
    let isPurchased = false;
    
    if (req.user) {
      const orders = await db.query(
        `SELECT id FROM orders 
         WHERE user_id = ? AND project_id = ? AND status = 'paid'`,
        [req.user.id, id]
      );
      isPurchased = orders.length > 0 || req.user.role === 'admin';
    }

    res.json({
      success: true,
      data: {
        project: {
          ...project,
          isPurchased
        }
      }
    });
  } catch (error) {
    logger.error('Get project error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project'
    });
  }
};

/**
 * Get secure download URL
 * GET /api/projects/:id/download
 */
const downloadProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Get project
    const projects = await db.query(
      'SELECT id, title, description FROM projects WHERE id = ?',
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];

    // Admin bypass
    if (isAdmin) {
      const downloadUrl = extractDownloadUrl(project.description);
      
      logger.download(userId, id, 'admin_download');
      
      return res.json({
        success: true,
        data: {
          downloadUrl: downloadUrl || '#',
          fileName: `${project.title.replace(/\s+/g, '_')}.zip`,
          message: 'Admin download'
        }
      });
    }

    // Check purchase
    const orders = await db.query(
      `SELECT id, created_at FROM orders 
       WHERE user_id = ? AND project_id = ? AND status = 'paid'
       ORDER BY created_at DESC LIMIT 1`,
      [userId, id]
    );

    if (orders.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this project to download'
      });
    }

    const orderId = orders[0].id;

    // Check/create download log
    let logs = await db.query(
      `SELECT * FROM download_logs 
       WHERE user_id = ? AND project_id = ? AND order_id = ?`,
      [userId, id, orderId]
    );

    const MAX_DOWNLOADS = 5;
    const EXPIRY_DAYS = 180;

    let downloadLog;

    if (logs.length === 0) {
      // Create new download log
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);

      const result = await db.query(
        `INSERT INTO download_logs 
         (user_id, project_id, order_id, download_count, max_downloads, expiry_date, last_downloaded_at)
         VALUES (?, ?, ?, 0, ?, ?, NOW())`,
        [userId, id, orderId, MAX_DOWNLOADS, expiryDate]
      );

      downloadLog = {
        id: result.insertId,
        download_count: 0,
        max_downloads: MAX_DOWNLOADS,
        expiry_date: expiryDate
      };
    } else {
      downloadLog = logs[0];
    }

    // Check expiry
    if (new Date(downloadLog.expiry_date) < new Date()) {
      logger.download(userId, id, 'expired');
      return res.status(403).json({
        success: false,
        message: 'Download link has expired. Contact support to renew access.'
      });
    }

    // Check download limit
    if (downloadLog.download_count >= downloadLog.max_downloads) {
      logger.download(userId, id, 'limit_reached');
      return res.status(403).json({
        success: false,
        message: `Download limit (${downloadLog.max_downloads}) reached. Contact support for additional downloads.`
      });
    }

    // Increment download count
    await db.query(
      `UPDATE download_logs 
       SET download_count = download_count + 1, last_downloaded_at = NOW()
       WHERE id = ?`,
      [downloadLog.id]
    );

    // Get actual download URL
    const actualUrl = extractDownloadUrl(project.description);

    if (!actualUrl || actualUrl === '#') {
      return res.status(404).json({
        success: false,
        message: 'Download link not available'
      });
    }

    // Generate signed URL
    const { signedUrl, expiry } = generateSignedUrl(
      id,
      userId,
      `/api/projects/${id}/secure-download`
    );

    const downloadsRemaining = downloadLog.max_downloads - downloadLog.download_count - 1;
    const daysUntilExpiry = Math.ceil(
      (new Date(downloadLog.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    logger.download(userId, id, 'download_initiated', downloadsRemaining);

    res.json({
      success: true,
      data: {
        // Return the actual URL for now (in production, would use signed URL proxy)
        downloadUrl: actualUrl,
        fileName: `${project.title.replace(/\s+/g, '_')}.zip`,
        downloads_remaining: downloadsRemaining,
        total_downloads: downloadLog.max_downloads,
        expiry_date: downloadLog.expiry_date,
        days_until_expiry: daysUntilExpiry
      },
      message: `Download started. ${downloadsRemaining} download${downloadsRemaining !== 1 ? 's' : ''} remaining.`
    });

  } catch (error) {
    logger.error('Download project error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to process download'
    });
  }
};

/**
 * Get all categories
 * GET /api/projects/categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await db.query(
      `SELECT category, COUNT(*) as count 
       FROM projects 
       WHERE category IS NOT NULL AND category != ''
       GROUP BY category 
       ORDER BY count DESC, category ASC`
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Get categories error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * Helper: Extract download URL from description JSON
 */
function extractDownloadUrl(description) {
  try {
    if (!description) return null;
    const desc = typeof description === 'string' ? JSON.parse(description) : description;
    return desc.download_url || null;
  } catch (e) {
    return null;
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  downloadProject,
  getCategories
};