// src/routes/wishlist.routes.js
const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { authRequired } = require('../middlewares/auth.middleware');

// All wishlist routes require authentication
router.get('/', authRequired, wishlistController.getWishlist);
router.post('/', authRequired, wishlistController.addToWishlist);
router.delete('/:projectId', authRequired, wishlistController.removeFromWishlist);

module.exports = router;