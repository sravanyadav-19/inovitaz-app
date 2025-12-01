/* project.model.js - simple wrapper */
const pool = require("../config/db");

module.exports = {
  list: async () => {
    const [rows] = await pool.query("SELECT id, title, description, price, thumbnail FROM projects ORDER BY id DESC");
    return rows;
  }
};
