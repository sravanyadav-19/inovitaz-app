const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }

  return secret;
};

const sign = (payload, options = {}) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: options.expiresIn || "7d",
    ...options,
  });
};

const verify = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  sign,
  verify,
};