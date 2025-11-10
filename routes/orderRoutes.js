const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/authMiddleware");
const catchAsync = require("../middlewares/catchAsync");
const order = require("../controllers/orderController");

router.get("/main/order", isLoggedIn, catchAsync(order.showOrders));
router.delete("/main/order/:id", isLoggedIn, catchAsync(order.deleteOrder));
router.get("/buyItem/:id", isLoggedIn, catchAsync(order.buyItemForm));
router.post("/buyItem/:id", isLoggedIn, catchAsync(order.buyItem));

module.exports = router;
