/* user.model.js - PostgreSQL query wrapper */

const db = require("../config/db");

module.exports = {
  findByEmail: async (email) => {
    const rows = await db.query(
      `SELECT id, name, email, password, role, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    return rows[0] || null;
  },

  findById: async (id) => {
    const rows = await db.query(
      `SELECT id, name, email, role, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    return rows[0] || null;
  },

  create: async ({ name, email, password, role = "user" }) => {
    const rows = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, password, role]
    );

    return rows[0];
  },
};