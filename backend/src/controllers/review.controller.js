const db = require('../config/db');

const reviewController = {
  getProjectReviews: async (req, res) => {
    try {
      const { projectId } = req.params;

      const reviews = await db.query(
        `SELECT
          r.id, r.rating, r.comment,
          r.is_verified_purchase, r.created_at,
          u.name as user_name, u.id as user_id
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.project_id = $1
         ORDER BY r.created_at DESC`,
        [projectId]
      );

      const stats = await db.query(
        `SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
         FROM reviews WHERE project_id = $1`,
        [projectId]
      );

      res.json({
        success: true,
        data: {
          reviews,
          average_rating: stats[0].average_rating
            ? parseFloat(stats[0].average_rating).toFixed(1) : 0,
          total_reviews: parseInt(stats[0].total_reviews)
        }
      });
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
  },

  submitReview: async (req, res) => {
    try {
      const { project_id, rating, comment } = req.body;
      const userId = req.user.id;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const orders = await db.query(
        `SELECT id FROM orders
         WHERE user_id = $1 AND project_id = $2 AND status = 'paid'
         LIMIT 1`,
        [userId, project_id]
      );

      if (orders.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You must purchase this project before reviewing'
        });
      }

      const orderId = orders[0].id;

      const existing = await db.query(
        'SELECT id FROM reviews WHERE user_id = $1 AND project_id = $2',
        [userId, project_id]
      );

      if (existing.length > 0) {
        await db.query(
          `UPDATE reviews
           SET rating = $1, comment = $2, updated_at = NOW()
           WHERE user_id = $3 AND project_id = $4`,
          [rating, comment, userId, project_id]
        );
      } else {
        await db.query(
          `INSERT INTO reviews (project_id, user_id, order_id, rating, comment)
           VALUES ($1, $2, $3, $4, $5)`,
          [project_id, userId, orderId, rating, comment]
        );
      }

      res.json({ success: true, message: 'Review submitted successfully' });
    } catch (error) {
      console.error('Submit review error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
  },

  deleteReview: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(
        'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or unauthorized'
        });
      }

      res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
  }
};

module.exports = reviewController;
