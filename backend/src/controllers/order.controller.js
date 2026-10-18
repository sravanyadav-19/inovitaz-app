const db = require('../config/db');

const normalizePage = (value, fallback = 1) => Math.max(parseInt(value, 10) || fallback, 1);
const normalizeLimit = (value, fallback = 10, max = 100) => Math.min(Math.max(parseInt(value, 10) || fallback, 1), max);

const getItemsForOrders = async (orderIds) => {
  if (orderIds.length === 0) return new Map();

  const rows = await db.query(
    `SELECT
       oi.order_id,
       oi.project_id,
       oi.quantity,
       oi.unit_price,
       oi.original_amount,
       oi.discount_amount,
       oi.final_amount,
       p.title AS project_title,
       p.thumbnail AS project_thumbnail,
       p.category AS project_category
     FROM order_items oi
     JOIN projects p ON p.id = oi.project_id
     WHERE oi.order_id = ANY($1::int[])
     ORDER BY oi.order_id DESC, oi.id ASC`,
    [orderIds]
  );

  return rows.reduce((itemsByOrder, item) => {
    const current = itemsByOrder.get(item.order_id) || [];
    current.push(item);
    itemsByOrder.set(item.order_id, current);
    return itemsByOrder;
  }, new Map());
};

const withItems = async (orders) => {
  const itemsByOrder = await getItemsForOrders(orders.map((order) => order.id));

  return orders.map((order) => {
    const items = itemsByOrder.get(order.id) || [];
    const firstItem = items[0];

    // Keep these legacy top-level fields while the Dashboard UI is migrated in
    // a later phase. New callers should use `items` and `item_count`.
    return {
      ...order,
      items,
      item_count: items.length,
      project_id: firstItem?.project_id ?? order.project_id ?? null,
      project_title: firstItem?.project_title ?? 'No projects',
      project_thumbnail: firstItem?.project_thumbnail ?? null,
      project_category: firstItem?.project_category ?? null,
    };
  });
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const safePage = normalizePage(page);
    const safeLimit = normalizeLimit(limit);
    const offset = (safePage - 1) * safeLimit;

    const params = [userId];
    let where = 'WHERE o.user_id = $1';
    if (status) {
      params.push(status);
      where += ` AND o.status = $${params.length}`;
    }

    params.push(safeLimit, offset);
    const orders = await db.query(
      `SELECT
         o.id,
         o.project_id,
         o.razorpay_order_id,
         o.razorpay_payment_id,
         o.amount,
         o.original_amount,
         o.discount_amount,
         o.coupon_code,
         o.currency,
         o.status,
         o.paid_at,
         o.created_at
       FROM orders o
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = [userId];
    let countWhere = 'WHERE user_id = $1';
    if (status) {
      countParams.push(status);
      countWhere += ` AND status = $2`;
    }
    const countResult = await db.query(`SELECT COUNT(*) AS total FROM orders ${countWhere}`, countParams);
    const total = parseInt(countResult[0]?.total || 0, 10);

    return res.json({
      success: true,
      data: {
        orders: await withItems(orders),
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          pages: Math.ceil(total / safeLimit),
        },
      },
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

const getPurchasedProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const downloads = await db.query(
      `SELECT
         o.id AS order_id,
         p.id,
         p.title,
         p.thumbnail,
         p.content_url,
         p.category,
         p.status,
         oi.final_amount AS amount,
         oi.original_amount,
         oi.discount_amount,
         o.created_at AS purchased_at,
         COALESCE(dl.download_count, 0) AS download_count,
         COALESCE(dl.max_downloads, 5) AS max_downloads,
         GREATEST(COALESCE(dl.max_downloads, 5) - COALESCE(dl.download_count, 0), 0) AS downloads_remaining,
         COALESCE(dl.expiry_date, o.created_at + INTERVAL '180 days') AS expiry_date,
         dl.last_downloaded_at
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN projects p ON p.id = oi.project_id
       LEFT JOIN download_logs dl ON dl.order_id = o.id AND dl.project_id = oi.project_id
       WHERE o.user_id = $1
         AND o.status = 'paid'
       ORDER BY o.created_at DESC, oi.id ASC`,
      [userId]
    );

    return res.json({ success: true, data: { downloads } });
  } catch (error) {
    console.error('Get purchased projects error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch purchased projects' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const orders = await db.query(
      `SELECT
         o.id,
         o.project_id,
         o.razorpay_order_id,
         o.razorpay_payment_id,
         o.amount,
         o.original_amount,
         o.discount_amount,
         o.coupon_code,
         o.currency,
         o.status,
         o.paid_at,
         o.created_at
       FROM orders o
       WHERE o.id = $1 AND o.user_id = $2
       LIMIT 1`,
      [id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [order] = await withItems(orders);
    return res.json({ success: true, data: { order } });
  } catch (error) {
    console.error('Get order by ID error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

module.exports = { getMyOrders, getPurchasedProjects, getOrderById };
