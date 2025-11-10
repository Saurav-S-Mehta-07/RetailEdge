const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/authMiddleware");
const catchAsync = require("../middlewares/catchAsync");
const category = require("../controllers/categoryController");

router.get("/main/categories", isLoggedIn, catchAsync(category.showCategories));
router.delete("/main/categories/:id", isLoggedIn, catchAsync(category.deleteCategoryItem));

module.exports = router;
