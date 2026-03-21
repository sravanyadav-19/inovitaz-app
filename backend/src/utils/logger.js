/**
 * Structured Logger Utility
 * Production-grade logging with context
 */

const isProduction = process.env.NODE_ENV === 'production';

const formatMessage = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 
    ? ` | ${JSON.stringify(context)}` 
    : '';
  
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

const logger = {
  info: (message, context = {}) => {
    console.log(formatMessage('info', message, context));
  },

  warn: (message, context = {}) => {
    console.warn(formatMessage('warn', message, context));
  },

  error: (message, context = {}) => {
    console.error(formatMessage('error', message, context));
  },

  debug: (message, context = {}) => {
    if (!isProduction) {
      console.log(formatMessage('debug', message, context));
    }
  },

  // Specific logging methods
  auth: (action, userId, email, success = true) => {
    logger.info(`AUTH: ${action}`, { userId, email, success });
  },

  payment: (action, orderId, amount, status) => {
    logger.info(`PAYMENT: ${action}`, { orderId, amount, status });
  },

  download: (userId, projectId, action, remaining = null) => {
    logger.info(`DOWNLOAD: ${action}`, { userId, projectId, remaining });
  },

  admin: (action, adminId, targetType, targetId) => {
    logger.info(`ADMIN: ${action}`, { adminId, targetType, targetId });
  }
};

module.exports = logger;