const db = require("../config/db");
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const axios = require("axios");

/**
 * Build project filter WHERE clause.
 */
const buildProjectFilters = ({ category, difficulty, maxPrice, technology, search }) => {
  let paramIndex = 1;
  const params = [];
  let whereSql = " WHERE 1=1 ";

  if (category) {
    whereSql += ` AND p.category = $${paramIndex++}`;
    params.push(category);
  }
  if (difficulty) {
    whereSql += ` AND p.difficulty = $${paramIndex++}`;
    params.push(difficulty);
  }
  if (maxPrice && String(maxPrice) !== "99900") {
    whereSql += ` AND p.price <= $${paramIndex++}`;
    params.push(Number(maxPrice));
  }
  if (technology) {
    whereSql += ` AND (
      p.title ILIKE $${paramIndex}
      OR p.description ILIKE $${paramIndex}
      OR p.category ILIKE $${paramIndex}
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(p.tech_stack, '[]'::jsonb)) AS tech(value)
        WHERE tech.value ILIKE $${paramIndex}
      )
    )`;
    params.push(`%${technology}%`);
    paramIndex++;
  }
  if (search) {
    whereSql += ` AND (
      p.title ILIKE $${paramIndex}
      OR p.description ILIKE $${paramIndex}
      OR p.category ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  return { whereSql, params, paramIndex };
};

const getAllProjects = async (req, res) => {
  try {
    const {
      category, search, sort = "newest", page = 1, limit = 12,
      difficulty, maxPrice, technology,
    } = req.query;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    const userId = req.user?.id || null;
    const isAdmin = req.user?.role === "admin";

    const { whereSql, params, paramIndex: nextParamIndex } = buildProjectFilters({
      category, difficulty, maxPrice, technology, search,
    });

    let paramIndex = nextParamIndex;
    let orderSql = " ORDER BY p.created_at DESC";

    switch (sort) {
      case "price_asc": orderSql = " ORDER BY p.price ASC"; break;
      case "price_desc": orderSql = " ORDER BY p.price DESC"; break;
      case "oldest": orderSql = " ORDER BY p.created_at ASC"; break;
      case "popular": orderSql = " ORDER BY p.reviews_count DESC, p.average_rating DESC"; break;
      case "rating": orderSql = " ORDER BY p.average_rating DESC, p.reviews_count DESC"; break;
      default: orderSql = " ORDER BY p.created_at DESC";
    }

    const wishlistSelect = userId
      ? `EXISTS (SELECT 1 FROM wishlist w WHERE w.project_id = p.id AND w.user_id = $${paramIndex++}) AS is_wishlisted,`
      : `FALSE AS is_wishlisted,`;
    if (userId) params.push(userId);

    const purchaseSelect = userId
      ? `EXISTS (SELECT 1 FROM orders o WHERE o.project_id = p.id AND o.user_id = $${paramIndex++} AND o.status = 'paid') AS is_purchased,`
      : `FALSE AS is_purchased,`;
    if (userId) params.push(userId);

    const contentUrlSelect = isAdmin ? "p.content_url," : "NULL AS content_url,";

    const sql = `
      SELECT p.id, p.title, p.description, p.price, p.thumbnail, ${contentUrlSelect}
             p.category, p.difficulty, p.average_rating, p.reviews_count,
             p.features, p.tech_stack, p.created_at, p.updated_at,
             ${wishlistSelect} ${purchaseSelect}
             CASE WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN TRUE ELSE FALSE END AS is_new
      FROM projects p
      ${whereSql}
      ${orderSql}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(safeLimit, offset);

    const projects = await db.query(sql, params);

    const { whereSql: countWhereSql, params: countParams } = buildProjectFilters({
      category, difficulty, maxPrice, technology, search,
    });
    const countResult = await db.query(`SELECT COUNT(*) AS total FROM projects p ${countWhereSql}`, countParams);
    const total = parseInt(countResult[0]?.total || 0, 10);

    return res.json({
      success: true,
      data: {
        projects: projects.map(p => ({
          ...p,
          isWishlisted: Boolean(p.is_wishlisted),
          isPurchased: Boolean(p.is_purchased),
        })),
        pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
      },
    });
  } catch (error) {
    logger.error("Get projects error", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to fetch projects" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const projects = await db.query(
      `SELECT id, title, description, price, thumbnail, content_url, category, difficulty,
              average_rating, reviews_count, features, tech_stack, created_at, updated_at
       FROM projects WHERE id = $1`, [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const project = projects[0];

    let isPurchased = false;
    let isWishlisted = false;

    if (req.user) {
      if (req.user.role === "admin") {
        isPurchased = true;
      } else {
        const orders = await db.query(
          `SELECT id FROM orders WHERE user_id = $1 AND project_id = $2 AND status = 'paid' LIMIT 1`,
          [req.user.id, id]
        );
        isPurchased = orders.length > 0;
      }

      const wishlistRows = await db.query(
        `SELECT id FROM wishlist WHERE user_id = $1 AND project_id = $2 LIMIT 1`,
        [req.user.id, id]
      );
      isWishlisted = wishlistRows.length > 0;
    }

    if (!isPurchased) delete project.content_url;

    return res.json({
      success: true,
      data: { project: { ...project, isPurchased, isWishlisted, is_wishlisted: isWishlisted } },
    });
  } catch (error) {
    logger.error("Get project error", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to fetch project" });
  }
};

const downloadProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const projects = await db.query(
      `SELECT id, title, description, content_url FROM projects WHERE id = $1`, [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const project = projects[0];

    // 1. Ownership/Purchase Check
    if (!isAdmin) {
      const orders = await db.query(
        `SELECT id FROM orders WHERE user_id = $1 AND project_id = $2 AND status = 'paid'`,
        [userId, id]
      );
      if (orders.length === 0) {
        return res.status(403).json({ success: false, message: "You do not own this project" });
      }

      const orderId = orders[0].id;

      // 2. Download Tracking & Rate Limiting
      let log = await db.query(
        `SELECT download_count, max_downloads, expiry_date FROM download_logs WHERE order_id = $1`,
        [orderId]
      );

      if (log.length === 0) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 180); // 180 days validity

        await db.query(
          `INSERT INTO download_logs (user_id, project_id, order_id, download_count, max_downloads, expiry_date)
           VALUES ($1, $2, $3, 0, 5, $4)`,
          [userId, id, orderId, expiryDate]
        );
        
        log = [{ download_count: 0, max_downloads: 5, expiry_date: expiryDate }];
      }

      const { download_count, max_downloads, expiry_date } = log[0];

      if (new Date() > new Date(expiry_date)) {
        return res.status(403).json({ success: false, message: "Your download access has expired" });
      }

      if (download_count >= max_downloads) {
        return res.status(403).json({ success: false, message: "You have reached the maximum number of downloads for this project" });
      }
    }

    const baseUrl = project.content_url || extractDownloadUrl(project);
    if (!baseUrl || baseUrl === "#") {
      return res.status(404).json({ success: false, message: "Download link not available" });
    }

    // 3. Increment Log Count (only after confirming file exists)
    if (!isAdmin) {
      const orders = await db.query(
        `SELECT id FROM orders WHERE user_id = $1 AND project_id = $2 AND status = 'paid' LIMIT 1`,
        [userId, id]
      );
      await db.query(
        `UPDATE download_logs 
         SET download_count = download_count + 1, 
             last_downloaded_at = CURRENT_TIMESTAMP 
         WHERE order_id = $1`,
        [orders[0].id]
      );
    }

    // 4. Generate Short-lived JWT for Proxy Stream
    const token = jwt.sign(
      { projectId: id, userId: userId },
      process.env.JWT_SECRET,
      { expiresIn: '2m' }
    );

    return res.json({
      success: true,
      data: {
        // FIX: Remove leading /api to prevent duplication with VITE_API_BASE_URL
        downloadUrl: `/projects/stream/${token}`,
        fileName: `${project.title.replace(/\s+/g, "_")}.zip`,
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        message: "Secure download session initialized.",
      },
    });
  } catch (error) {
    logger.error("Download project error", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to process download" });
  }
};

/**
 * Proxy Streamer for Google Drive
 * Handles JWT verification and streaming
 */
const streamProjectFile = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ success: false, message: "Token missing" });
    }

    // 1. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired download session" });
    }

    const { projectId } = decoded;

    // 2. Get Project Metadata
    const projects = await db.query(
      `SELECT title, content_url, description FROM projects WHERE id = $1`, [projectId]
    );
    if (projects.length === 0) return res.status(404).send("Project not found");
    const project = projects[0];

    const baseUrl = project.content_url || extractDownloadUrl(project);
    if (!baseUrl || baseUrl === "#") return res.status(404).send("Download link not available");

    // 3. Convert Google Drive Link to Direct Download
    let downloadUrl = baseUrl;
    if (baseUrl.includes('drive.google.com')) {
      const fileIdMatch = baseUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || baseUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      }
    }

    // 4. Fetch and Stream from Google Drive
    try {
      const response = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'stream',
        timeout: 30000,
      });

      // Handle Google Drive "Large File" warning
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        const html = await new Promise((resolve) => {
          let data = '';
          response.data.on('data', chunk => data += chunk);
          response.data.on('end', () => resolve(data));
        });

        const confirmMatch = html.match(/confirm=([a-zA-Z0-9_-]+)/);
        if (confirmMatch && confirmMatch[1]) {
          const confirmUrl = `${downloadUrl}&confirm=${confirmMatch[1]}`;
          const secondResponse = await axios({
            method: 'get',
            url: confirmUrl,
            responseType: 'stream',
          });
          return secondResponse.data.pipe(res);
        }
        return res.status(500).send("Could not bypass Google Drive virus scan warning");
      }

      // Set Headers and Pipe
      res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/\s+/g, "_")}.zip"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      return response.data.pipe(res);

    } catch (error) {
      logger.error("Proxy stream error", { error: error.message });
      return res.status(500).send("Error streaming file from storage");
    }
  } catch (error) {
    logger.error("Stream project error", { error: error.message });
    return res.status(500).send("Internal server error");
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await db.query(
      `SELECT category, COUNT(*) AS count FROM projects 
       WHERE category IS NOT NULL AND category != '' 
       GROUP BY category ORDER by count DESC, category ASC`
    );
    return res.json({ success: true, data: categories });
  } catch (error) {
    logger.error("Get categories error", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

function extractDownloadUrl(project) {
  if (!project) return null;
  if (project.content_url) return project.content_url;
  try {
    const desc = typeof project.description === "string" 
      ? JSON.parse(project.description) 
      : project.description;
    return desc?.download_url || null;
  } catch {
    return null;
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  downloadProject,
  streamProjectFile,
  getCategories,
};