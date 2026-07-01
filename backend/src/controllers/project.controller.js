const db = require("../config/db");
const logger = require("../utils/logger");
const { generateSignedUrl } = require("../utils/signedUrl");

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
      `SELECT id, title, description, content_url, user_id FROM projects WHERE id = $1`, [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const project = projects[0];

    // Ownership check (from Day 1)
    if (!isAdmin && project.user_id !== userId) {
      const orders = await db.query(
        `SELECT id FROM orders WHERE user_id = $1 AND project_id = $2 AND status = 'paid'`,
        [userId, id]
      );
      if (orders.length === 0) {
        return res.status(403).json({ success: false, message: "You do not own this project" });
      }
    }

    const baseUrl = project.content_url || extractDownloadUrl(project);
    if (!baseUrl || baseUrl === "#") {
      return res.status(404).json({ success: false, message: "Download link not available" });
    }

    // === DAY 2: Generate Signed URL ===
    const signedData = generateSignedUrl(id, userId, baseUrl);

    return res.json({
      success: true,
      data: {
        downloadUrl: signedData.signedUrl,
        fileName: `${project.title.replace(/\s+/g, "_")}.zip`,
        expires_at: new Date(signedData.expiry).toISOString(),
        message: "Signed URL generated. Valid for 1 hour.",
      },
    });
  } catch (error) {
    logger.error("Download project error", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to process download" });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await db.query(
      `SELECT category, COUNT(*) AS count FROM projects 
       WHERE category IS NOT NULL AND category != '' 
       GROUP BY category ORDER BY count DESC, category ASC`
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
  getCategories,
};