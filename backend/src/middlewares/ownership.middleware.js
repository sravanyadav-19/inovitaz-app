const db = require('../config/db');

/**
 * Ownership verification middleware
 * Verifies that the authenticated user owns the resource
 */

// Verify project ownership
const verifyProjectOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Admins bypass ownership check
    if (userRole === 'admin') {
      return next();
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const result = await db.query(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (result[0].user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this project' 
      });
    }

    next();
  } catch (error) {
    console.error('Project ownership check error:', error);
    return res.status(500).json({ success: false, message: 'Authorization error' });
  }
};

// Verify order ownership
const verifyOrderOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole === 'admin') {
      return next();
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const result = await db.query(
      'SELECT user_id FROM orders WHERE id = $1',
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (result[0].user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this order' 
      });
    }

    next();
  } catch (error) {
    console.error('Order ownership check error:', error);
    return res.status(500).json({ success: false, message: 'Authorization error' });
  }
};

module.exports = {
  verifyProjectOwnership,
  verifyOrderOwnership,
};