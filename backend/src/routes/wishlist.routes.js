const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { authRequired } = require('../middlewares/auth.middleware');
const { wishlistValidation } = require('../utils/validationSchemas');
const { validate } = require('../middlewares/validate.middleware');

router.post('/', authRequired, wishlistValidation, validate, wishlistController.addToWishlist);
router.get('/', authRequired, wishlistController.getWishlist);
router.delete('/:projectId', authRequired, wishlistController.removeFromWishlist);

module.exports = router;