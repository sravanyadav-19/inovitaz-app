/* project.model.js - PostgreSQL query wrapper */

const db = require("../config/db");

module.exports = {
  list: async () => {
    return await db.query(
      `SELECT
          id,
          title,
          description,
          price,
          thumbnail,
          content_url,
          category,
          difficulty,
          average_rating,
          reviews_count,
          features,
          tech_stack,
          created_at,
          updated_at
       FROM projects
       ORDER BY id DESC`
    );
  },

  findById: async (id) => {
    const rows = await db.query(
      `SELECT *
       FROM projects
       WHERE id = $1`,
      [id]
    );

    return rows[0] || null;
  },

  create: async ({
    title,
    description,
    price,
    thumbnail = null,
    content_url = null,
    category = "IoT",
    difficulty = "Beginner",
    features = null,
    tech_stack = null,
  }) => {
    const rows = await db.query(
      `INSERT INTO projects
        (
          title,
          description,
          price,
          thumbnail,
          content_url,
          category,
          difficulty,
          features,
          tech_stack
        )
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title,
        description,
        price,
        thumbnail,
        content_url,
        category,
        difficulty,
        features ? JSON.stringify(features) : null,
        tech_stack ? JSON.stringify(tech_stack) : null,
      ]
    );

    return rows[0];
  },

  update: async (id, data) => {
    const allowedFields = [
      "title",
      "description",
      "price",
      "thumbnail",
      "content_url",
      "category",
      "difficulty",
      "features",
      "tech_stack",
    ];

    const fields = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${values.length + 1}`);

        if (field === "features" || field === "tech_stack") {
          values.push(data[field] ? JSON.stringify(data[field]) : null);
        } else {
          values.push(data[field]);
        }
      }
    }

    if (fields.length === 0) {
      return await module.exports.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const rows = await db.query(
      `UPDATE projects
       SET ${fields.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    return rows[0] || null;
  },

  delete: async (id) => {
    const rows = await db.query(
      `DELETE FROM projects
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return rows[0] || null;
  },
};