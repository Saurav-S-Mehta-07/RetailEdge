const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });
const { isLoggedIn } = require("../middlewares/authMiddleware");
const catchAsync = require("../middlewares/catchAsync");
const item = require("../controllers/itemController");

router.get("/addlist", isLoggedIn, catchAsync(item.renderAddItem));
router.post("/main", isLoggedIn, upload.single("image"), catchAsync(item.createItem));
router.get("/main/show/:id", isLoggedIn, catchAsync(item.showItem));
router.post("/main/show/:id", isLoggedIn, upload.single("image"), catchAsync(item.updateItem));
router.get("/main/edit/:id", isLoggedIn, catchAsync(item.renderEditItem));
router.delete("/main/:id", isLoggedIn, catchAsync(item.deleteItem));

module.exports = router;
