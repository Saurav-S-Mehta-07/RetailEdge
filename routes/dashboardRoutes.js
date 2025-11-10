const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/authMiddleware");
const catchAsync = require("../middlewares/catchAsync");
const dash = require("../controllers/dashboardController");

router.get("/main", isLoggedIn, catchAsync(dash.renderDashboard));
router.get("/main/dashboard", isLoggedIn, catchAsync(dash.renderAnalytics));

module.exports = router;
