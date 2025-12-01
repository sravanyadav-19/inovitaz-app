const db = require('../config/db');

/**
 * Get all projects (public)
 * GET /api/projects
 */
const getAllProjects = async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 12 } = req.query;
    
    let sql = `
      SELECT 
        id, title, description, price, thumbnail, category,
        created_at, updated_at
      FROM projects 
      WHERE 1=1
    `;
    const params = [];

    // Filter by category
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    // Search
    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY price DESC';
        break;
      case 'oldest':
        sql += ' ORDER BY created_at ASC';
        break;
      case 'newest':
      default:
        sql += ' ORDER BY created_at DESC';
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const projects = await db.query(sql, params);

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM projects WHERE 1=1';
    const countParams = [];
    
    if (category) {
      countSql += ' AND category = ?';
      countParams.push(category);
    }
    if (search) {
      countSql += ' AND (title LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
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
    if (req.user) {
      const orders = await db.query(
        `SELECT id FROM orders 
         WHERE user_id = ? AND project_id = ? AND status = 'paid'`,
        [req.user.id, id]
      );
      isPurchased = orders.length > 0;
    }

    res.json({
      success: true,
      data: {
        ...project,
        isPurchased
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
 */
const downloadProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has purchased this project
    const orders = await db.query(
      `SELECT o.id, p.content_url, p.title 
       FROM orders o 
       JOIN projects p ON o.project_id = p.id 
       WHERE o.user_id = ? AND o.project_id = ? AND o.status = 'paid'`,
      [req.user.id, id]
    );

    if (orders.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You have not purchased this project'
      });
    }

    const { content_url, title } = orders[0];

    // In production, you would serve the actual file or generate a signed URL
    // For now, return the download URL
    res.json({
      success: true,
      data: {
        downloadUrl: content_url,
        fileName: `${title.replace(/\s+/g, '_')}.zip`,
        expiresIn: 3600 // URL expires in 1 hour (for signed URLs)
      }
    });
  } catch (error) {
    console.error('Download project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download link'
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
      `SELECT DISTINCT category, COUNT(*) as count 
       FROM projects 
       GROUP BY category 
       ORDER BY category`
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