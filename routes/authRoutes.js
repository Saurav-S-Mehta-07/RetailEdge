const express = require("express");
const router = express.Router();
const passport = require("passport");
const catchAsync = require("../middlewares/catchAsync");
const { redirectIfLoggedIn } = require("../middlewares/authMiddleware");
const auth = require("../controllers/authController");

router.get("/", redirectIfLoggedIn, auth.renderLogin);
router.get("/signup", redirectIfLoggedIn, auth.renderSignup);
router.post("/signup", catchAsync(auth.signup));
router.post("/login", passport.authenticate("local", { failureRedirect: "/", failureFlash: true }), auth.login);
router.get("/logout", auth.logout);

module.exports = router;
