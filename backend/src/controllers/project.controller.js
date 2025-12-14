// src/controllers/project.controller.js
const db = require('../config/db');

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
      difficulty,      // NEW
      maxPrice,        // NEW
      technology       // NEW
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

    // NEW: Filter by difficulty
    if (difficulty) {
      sql += ' AND p.difficulty = ?';
      params.push(difficulty);
    }

    // NEW: Filter by max price
    if (maxPrice && maxPrice !== '999') {
      sql += ' AND p.price <= ?';
      params.push(parseInt(maxPrice));
    }

    // NEW: Filter by technology (searches in title/description)
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
      case 'popular':  // NEW
        sql += ' ORDER BY p.reviews_count DESC, p.average_rating DESC';
        break;
      case 'rating':   // NEW
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

    // Get total count for pagination
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
    console.error('Get projects error:', error);
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
    
    // Parse JSON fields
    if (project.features) {
      try {
        project.features = JSON.parse(project.features);
      } catch (e) {
        project.features = [];
      }
    }
    
    if (project.tech_stack) {
      try {
        project.tech_stack = JSON.parse(project.tech_stack);
      } catch (e) {
        project.tech_stack = [];
      }
    }

    // Check if user has purchased this project
    let isPurchased = false;
    
    if (req.user) {  // This will now work because authOptional sets req.user
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
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project'
    });
  }
};

/**
 * Get project download (protected - only for purchased users)
 * GET /api/projects/:id/download
 * ENHANCED: Now tracks downloads
 */
const downloadProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Admin bypass
    if (isAdmin) {
      const projects = await db.query(
        'SELECT description, title FROM projects WHERE id = ?',
        [id]
      );

      if (projects.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }

      let downloadUrl = null;
      try {
        const desc = JSON.parse(projects[0].description);
        downloadUrl = desc.download_url;
      } catch (e) {
        downloadUrl = null;
      }

      return res.json({
        success: true,
        data: {
          downloadUrl: downloadUrl || '#',
          fileName: `${projects[0].title.replace(/\s+/g, '_')}.zip`,
          message: 'Admin download'
        },
      });
    }

    // Check if user purchased this project
    const orders = await db.query(
      `SELECT id, created_at FROM orders 
       WHERE user_id = ? AND project_id = ? AND status = 'paid'
       ORDER BY created_at DESC
       LIMIT 1`,
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
    const [logs] = await db.query(
      `SELECT * FROM download_logs 
       WHERE user_id = ? AND project_id = ? AND order_id = ?`,
      [userId, id, orderId]
    );

    let downloadLog;
    const MAX_DOWNLOADS = 5;
    const EXPIRY_DAYS = 180; // 6 months

    if (logs.length === 0) {
      // Create new download log
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);

      const [result] = await db.query(
        `INSERT INTO download_logs 
         (user_id, project_id, order_id, download_count, max_downloads, expiry_date, last_downloaded_at)
         VALUES (?, ?, ?, 1, ?, ?, NOW())`,
        [userId, id, orderId, MAX_DOWNLOADS, expiryDate]
      );

      downloadLog = {
        id: result.insertId,
        download_count: 1,
        max_downloads: MAX_DOWNLOADS,
        expiry_date: expiryDate
      };
    } else {
      downloadLog = logs[0];

      // Check expiry
      if (new Date(downloadLog.expiry_date) < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Download link has expired. Contact support to renew access.'
        });
      }

      // Check download limit
      if (downloadLog.download_count >= downloadLog.max_downloads) {
        return res.status(403).json({
          success: false,
          message: `Download limit (${downloadLog.max_downloads}) reached. Contact support for additional downloads.`
        });
      }

      // Increment download count
      await db.query(
        `UPDATE download_logs 
         SET download_count = download_count + 1,
             last_downloaded_at = NOW()
         WHERE id = ?`,
        [downloadLog.id]
      );

      downloadLog.download_count += 1;
    }

    // Get project download URL
    const projects = await db.query(
      'SELECT title, description FROM projects WHERE id = ?',
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    let downloadUrl = null;
    try {
      const desc = JSON.parse(projects[0].description);
      downloadUrl = desc.download_url;
    } catch (e) {
      downloadUrl = null;
    }

    if (!downloadUrl) {
      return res.status(404).json({
        success: false,
        message: 'Download link not available'
      });
    }

    const downloadsRemaining = downloadLog.max_downloads - downloadLog.download_count;
    const daysUntilExpiry = Math.ceil(
      (new Date(downloadLog.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: `${projects[0].title.replace(/\s+/g, '_')}.zip`,
        downloads_remaining: downloadsRemaining,
        total_downloads: downloadLog.max_downloads,
        expiry_date: downloadLog.expiry_date,
        days_until_expiry: daysUntilExpiry
      },
      message: `Download started. ${downloadsRemaining} download${downloadsRemaining !== 1 ? 's' : ''} remaining.`
    });

  } catch (error) {
    console.error('Download project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process download'
    });
  }
};

/**
 * Get all categories with project counts
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
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  downloadProject,
  getCategories
};