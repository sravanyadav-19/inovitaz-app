const db = require("../config/db");
const logger = require("../utils/logger");

/**
 * Build project filter WHERE clause.
 * Price is expected in PAISE.
 */
const buildProjectFilters = ({
  category,
  difficulty,
  maxPrice,
  technology,
  search,
}) => {
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

  /**
   * Frontend should send maxPrice in paise:
   * ₹299 => 29900
   * ₹499 => 49900
   * Any  => 99900
   */
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
        SELECT 1
        FROM jsonb_array_elements_text(COALESCE(p.tech_stack, '[]'::jsonb)) AS tech(value)
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
      category,
      search,
      sort = "newest",
      page = 1,
      limit = 12,
      difficulty,
      maxPrice,
      technology,
    } = req.query;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    const userId = req.user?.id || null;
    const isAdmin = req.user?.role === "admin";

    const {
      whereSql,
      params,
      paramIndex: nextParamIndex,
    } = buildProjectFilters({
      category,
      difficulty,
      maxPrice,
      technology,
      search,
    });

    let paramIndex = nextParamIndex;

    let orderSql = " ORDER BY p.created_at DESC";

    switch (sort) {
      case "price_asc":
        orderSql = " ORDER BY p.price ASC";
        break;
      case "price_desc":
        orderSql = " ORDER BY p.price DESC";
        break;
      case "oldest":
        orderSql = " ORDER BY p.created_at ASC";
        break;
      case "popular":
        orderSql = " ORDER BY p.reviews_count DESC, p.average_rating DESC";
        break;
      case "rating":
        orderSql = " ORDER BY p.average_rating DESC, p.reviews_count DESC";
        break;
      case "newest":
      default:
        orderSql = " ORDER BY p.created_at DESC";
        break;
    }

    const wishlistSelect = userId
      ? `EXISTS (
          SELECT 1
          FROM wishlist w
          WHERE w.project_id = p.id
            AND w.user_id = $${paramIndex++}
        ) AS is_wishlisted,`
      : `FALSE AS is_wishlisted,`;

    if (userId) {
      params.push(userId);
    }

    const purchaseSelect = userId
      ? `EXISTS (
          SELECT 1
          FROM orders o
          WHERE o.project_id = p.id
            AND o.user_id = $${paramIndex++}
            AND o.status = 'paid'
        ) AS is_purchased,`
      : `FALSE AS is_purchased,`;

    if (userId) {
      params.push(userId);
    }

    const contentUrlSelect = isAdmin
      ? "p.content_url,"
      : "NULL AS content_url,";

    const sql = `
      SELECT
        p.id,
        p.title,
        p.description,
        p.price,
        p.thumbnail,
        ${contentUrlSelect}
        p.category,
        p.difficulty,
        p.average_rating,
        p.reviews_count,
        p.features,
        p.tech_stack,
        p.created_at,
        p.updated_at,
        ${wishlistSelect}
        ${purchaseSelect}
        CASE
          WHEN p.created_at >= NOW() - INTERVAL '7 days'
          THEN TRUE
          ELSE FALSE
        END AS is_new
      FROM projects p
      ${whereSql}
      ${orderSql}
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++}
    `;

    params.push(safeLimit, offset);

    const projects = await db.query(sql, params);

    const {
      whereSql: countWhereSql,
      params: countParams,
    } = buildProjectFilters({
      category,
      difficulty,
      maxPrice,
      technology,
      search,
    });

    const countSql = `
      SELECT COUNT(*) AS total
      FROM projects p
      ${countWhereSql}
    `;

    const countResult = await db.query(countSql, countParams);
    const total = parseInt(countResult[0]?.total || 0, 10);

    return res.json({
      success: true,
      data: {
        projects: projects.map((project) => ({
          ...project,
          isWishlisted: Boolean(project.is_wishlisted),
          isPurchased: Boolean(project.is_purchased),
        })),
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          pages: Math.ceil(total / safeLimit),
        },
      },
    });
  } catch (error) {
    logger.error("Get projects error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const projects = await db.query(
      `SELECT
          id,
          title,
          description,
          price,
          thumbnail,
          content_url,
          category,
          difficulty,
          average_rating,
          reviews_count,
          features,
          tech_stack,
          created_at,
          updated_at
       FROM projects
       WHERE id = $1`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = projects[0];

    try {
      if (typeof project.features === "string") {
        project.features = JSON.parse(project.features);
      }
    } catch {
      project.features = [];
    }

    try {
      if (typeof project.tech_stack === "string") {
        project.tech_stack = JSON.parse(project.tech_stack);
      }
    } catch {
      project.tech_stack = [];
    }

    let isPurchased = false;
    let isWishlisted = false;

    if (req.user) {
      if (req.user.role === "admin") {
        isPurchased = true;
      } else {
        const orders = await db.query(
          `SELECT id
           FROM orders
           WHERE user_id = $1
             AND project_id = $2
             AND status = 'paid'
           LIMIT 1`,
          [req.user.id, id]
        );

        isPurchased = orders.length > 0;
      }

      const wishlistRows = await db.query(
        `SELECT id
         FROM wishlist
         WHERE user_id = $1
           AND project_id = $2
         LIMIT 1`,
        [req.user.id, id]
      );

      isWishlisted = wishlistRows.length > 0;
    }

    /**
     * Do not expose direct download/content URL to non-buyers.
     */
    if (!isPurchased) {
      delete project.content_url;
    }

    return res.json({
      success: true,
      data: {
        project: {
          ...project,
          isPurchased,
          isWishlisted,
          is_wishlisted: isWishlisted,
        },
      },
    });
  } catch (error) {
    logger.error("Get project error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
};

const downloadProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const projects = await db.query(
      `SELECT id, title, description, content_url
       FROM projects
       WHERE id = $1`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = projects[0];

    if (isAdmin) {
      const downloadUrl = extractDownloadUrl(project);

      return res.json({
        success: true,
        data: {
          downloadUrl: downloadUrl || "#",
          fileName: `${project.title.replace(/\s+/g, "_")}.zip`,
          message: "Admin download",
        },
      });
    }

    const orders = await db.query(
      `SELECT id, created_at
       FROM orders
       WHERE user_id = $1
         AND project_id = $2
         AND status = 'paid'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, id]
    );

    if (orders.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this project to download",
      });
    }

    const orderId = orders[0].id;
    const MAX_DOWNLOADS = 5;
    const EXPIRY_DAYS = 180;

    const logs = await db.query(
      `SELECT *
       FROM download_logs
       WHERE user_id = $1
         AND project_id = $2
         AND order_id = $3`,
      [userId, id, orderId]
    );

    let downloadLog;

    if (logs.length === 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);

      const result = await db.query(
        `INSERT INTO download_logs
          (
            user_id,
            project_id,
            order_id,
            download_count,
            max_downloads,
            expiry_date
          )
         VALUES
          ($1, $2, $3, 0, $4, $5)
         RETURNING *`,
        [userId, id, orderId, MAX_DOWNLOADS, expiryDate]
      );

      downloadLog = result[0];
    } else {
      downloadLog = logs[0];
    }

    if (new Date(downloadLog.expiry_date) < new Date()) {
      return res.status(403).json({
        success: false,
        message: "Download link has expired. Contact support to renew access.",
      });
    }

    if (downloadLog.download_count >= downloadLog.max_downloads) {
      return res.status(403).json({
        success: false,
        message: `Download limit (${downloadLog.max_downloads}) reached.`,
      });
    }

    const actualUrl = extractDownloadUrl(project);

    if (!actualUrl || actualUrl === "#") {
      return res.status(404).json({
        success: false,
        message: "Download link not available",
      });
    }

    await db.query(
      `UPDATE download_logs
       SET download_count = download_count + 1,
           last_downloaded_at = NOW()
       WHERE id = $1`,
      [downloadLog.id]
    );

    const downloadsRemaining =
      downloadLog.max_downloads - downloadLog.download_count - 1;

    const daysUntilExpiry = Math.ceil(
      (new Date(downloadLog.expiry_date) - new Date()) /
        (1000 * 60 * 60 * 24)
    );

    return res.json({
      success: true,
      data: {
        downloadUrl: actualUrl,
        fileName: `${project.title.replace(/\s+/g, "_")}.zip`,
        downloads_remaining: downloadsRemaining,
        total_downloads: downloadLog.max_downloads,
        expiry_date: downloadLog.expiry_date,
        days_until_expiry: daysUntilExpiry,
      },
    });
  } catch (error) {
    logger.error("Download project error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: "Failed to process download",
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await db.query(
      `SELECT category, COUNT(*) AS count
       FROM projects
       WHERE category IS NOT NULL
         AND category != ''
       GROUP BY category
       ORDER BY count DESC, category ASC`
    );

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error("Get categories error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

/**
 * Accepts whole project object.
 * Priority:
 * 1. projects.content_url
 * 2. description JSON download_url
 */
function extractDownloadUrl(project) {
  if (!project) return null;

  if (project.content_url) {
    return project.content_url;
  }

  try {
    if (!project.description) return null;

    const desc =
      typeof project.description === "string"
        ? JSON.parse(project.description)
        : project.description;

    return desc.download_url || null;
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