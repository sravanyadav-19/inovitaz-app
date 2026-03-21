/**
 * Signed URL Generator
 * Creates time-limited, cryptographically signed download URLs
 */

const crypto = require('crypto');

const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET;
const URL_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a signed download URL
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID
 * @param {string} baseUrl - Base download URL
 * @returns {object} - { signedUrl, expiry }
 */
const generateSignedUrl = (projectId, userId, baseUrl) => {
  const expiry = Date.now() + URL_EXPIRY_MS;
  const data = `${projectId}-${userId}-${expiry}`;
  
  const signature = crypto
    .createHmac('sha256', DOWNLOAD_SECRET)
    .update(data)
    .digest('hex');

  return {
    signature,
    expiry,
    signedUrl: `${baseUrl}?sig=${signature}&exp=${expiry}&uid=${userId}`
  };
};

/**
 * Verify a signed URL
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID from token
 * @param {string} signature - URL signature
 * @param {number} expiry - Expiry timestamp
 * @returns {object} - { valid: boolean, reason?: string }
 */
const verifySignedUrl = (projectId, userId, signature, expiry) => {
  // Check expiry
  if (Date.now() > expiry) {
    return { valid: false, reason: 'URL has expired' };
  }

  // Verify signature
  const data = `${projectId}-${userId}-${expiry}`;
  const expectedSignature = crypto
    .createHmac('sha256', DOWNLOAD_SECRET)
    .update(data)
    .digest('hex');

  if (signature !== expectedSignature) {
    return { valid: false, reason: 'Invalid signature' };
  }

  return { valid: true };
};

module.exports = {
  generateSignedUrl,
  verifySignedUrl
};