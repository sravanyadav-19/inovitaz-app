// src/middlewares/authOptional.js
const jwt = require("jsonwebtoken");
const db = require('../config/db');

module.exports = async function authOptional(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const users = await db.query(
          'SELECT id, email, name, role FROM users WHERE id = $1',
          [decoded.id]
        );

        req.user = (users && users.length > 0) ? users[0] : null;

      } catch (jwtError) {
        req.user = null;
      }
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }

  next();
};
