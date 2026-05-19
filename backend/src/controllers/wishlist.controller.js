const db = require('../config/db');

const wishlistController = {
  getWishlist: async (req, res) => {
    try {
      const userId = req.user.id;

      const items = await db.query(
        `SELECT
          w.id as wishlist_id,
          p.id, p.title, p.description, p.price,
          p.thumbnail, p.category, p.difficulty,
          p.average_rating, p.reviews_count,
          w.created_at as added_at
         FROM wishlist w
         JOIN projects p ON w.project_id = p.id
         WHERE w.user_id = $1
         ORDER BY w.created_at DESC`,
        [userId]
      );

      res.json({ success: true, data: items });
    } catch (error) {
      console.error('Get wishlist error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
    }
  },

  addToWishlist: async (req, res) => {
    try {
      const { project_id } = req.body;
      const userId = req.user.id;

      const projects = await db.query(
        'SELECT id FROM projects WHERE id = $1', [project_id]
      );

      if (projects.length === 0) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const existing = await db.query(
        'SELECT id FROM wishlist WHERE user_id = $1 AND project_id = $2',
        [userId, project_id]
      );

      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Project already in wishlist' });
      }

      await db.query(
        'INSERT INTO wishlist (user_id, project_id) VALUES ($1, $2)',
        [userId, project_id]
      );

      res.status(201).json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
      console.error('Add to wishlist error:', error);
      res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
    }
  },

  removeFromWishlist: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const result = await db.query(
        'DELETE FROM wishlist WHERE user_id = $1 AND project_id = $2 RETURNING id',
        [userId, projectId]
      );

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
      }

      res.json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
    }
  }
};

module.exports = wishlistController;
