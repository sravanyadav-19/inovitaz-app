const logger = require('../utils/logger');

/**
 * Admin Action Audit Middleware
 * Logs all admin actions with user details and request info
 */
const adminAuditLogger = (action) => {
  return (req, res, next) => {
    const adminId = req.user?.id;
    const adminEmail = req.user?.email;
    const ip = req.ip || req.connection.remoteAddress;
    const method = req.method;
    const path = req.originalUrl;

    // Log the admin action
    logger.admin(action, adminId, 'admin_action', {
      email: adminEmail,
      ip,
      method,
      path,
      body: req.body ? JSON.stringify(req.body).substring(0, 200) : null,
      timestamp: new Date().toISOString()
    });

    // Continue to the next middleware/controller
    next();
  };
};

module.exports = { adminAuditLogger };