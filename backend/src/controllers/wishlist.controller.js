// src/controllers/wishlist.controller.js
const db = require('../config/db');

const wishlistController = {
  // Get user's wishlist
  getWishlist: async (req, res) => {
    try {
      const userId = req.user.id;

      const [items] = await db.query(
        `SELECT 
          w.id as wishlist_id,
          p.id,
          p.title,
          p.description,
          p.price,
          p.thumbnail,
          p.category,
          p.difficulty,
          p.average_rating,
          p.reviews_count,
          w.created_at as added_at
         FROM wishlist w
         JOIN projects p ON w.project_id = p.id
         WHERE w.user_id = ?
         ORDER BY w.created_at DESC`,
        [userId]
      );

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Get wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wishlist'
      });
    }
  },

  // Add to wishlist
  addToWishlist: async (req, res) => {
    try {
      const { project_id } = req.body;
      const userId = req.user.id;

      // Check if project exists
      const [projects] = await db.query(
        'SELECT id FROM projects WHERE id = ?',
        [project_id]
      );

      if (projects.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if already in wishlist
      const [existing] = await db.query(
        'SELECT id FROM wishlist WHERE user_id = ? AND project_id = ?',
        [userId, project_id]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Project already in wishlist'
        });
      }

      // Add to wishlist
      await db.query(
        'INSERT INTO wishlist (user_id, project_id) VALUES (?, ?)',
        [userId, project_id]
      );

      res.status(201).json({
        success: true,
        message: 'Added to wishlist'
      });
    } catch (error) {
      console.error('Add to wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add to wishlist'
      });
    }
  },

  // Remove from wishlist
  removeFromWishlist: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const [result] = await db.query(
        'DELETE FROM wishlist WHERE user_id = ? AND project_id = ?',
        [userId, projectId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in wishlist'
        });
      }

      res.json({
        success: true,
        message: 'Removed from wishlist'
      });
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove from wishlist'
      });
    }
  }
};

module.exports = wishlistController;