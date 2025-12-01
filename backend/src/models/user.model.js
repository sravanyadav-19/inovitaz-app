/* user.model.js - simple query wrapper */
const pool = require("../config/db");

module.exports = {
  findByEmail: async (email) => {
    const [rows] = await pool.query("SELECT id, email, password_hash FROM users WHERE email = ?", [email]);
    return rows[0];
  }
};
