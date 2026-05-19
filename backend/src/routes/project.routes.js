const express = require("express");
const router = express.Router();

const projectController = require("../controllers/project.controller");
const reviewController = require("../controllers/review.controller");
const { authRequired } = require("../middlewares/auth.middleware");
const authOptional = require("../middlewares/authOptional");

// Public routes
router.get("/", authOptional, projectController.getAllProjects);
router.get("/categories", projectController.getCategories);

// Specific dynamic routes before generic /:id
router.get("/:projectId/reviews", authOptional, reviewController.getProjectReviews);

// Generic project route
router.get("/:id", authOptional, projectController.getProjectById);

// Protected routes
router.get("/:id/download", authRequired, projectController.downloadProject);

module.exports = router;