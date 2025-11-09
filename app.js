const express = require("express");
const path = require("path");
const engine = require("ejs-mate");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const MongoStore = require("connect-mongo");
require("dotenv").config();

const Item = require("./models/Item");
const Shopkeeper = require("./models/Shopkeeper");

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Middleware for parsing body data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method override to enable PUT/DELETE
app.use(methodOverride("_method"));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "shopkeeper-items",
    allowed_formats: ["jpeg", "png", "jpg", "gif"],
  },
});
const upload = multer({ storage });

// MongoDB Atlas connection string (with TLS)
const connectionString = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority&tls=true`;

// Connect to MongoDB Atlas
async function connectDB() {
  try {
    await mongoose.connect(connectionString);
    console.log("MongoDB Atlas Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    setTimeout(connectDB, 5000);
  }
}
connectDB();

// Session store using MongoDB
const sessionStore = MongoStore.create({
  mongoUrl: connectionString,
  collectionName: "sessions",
  ttl: 14 * 24 * 60 * 60, // 14 days
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

// Flash messages
app.use(flash());

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: "email" }, Shopkeeper.authenticate()));

passport.serializeUser((user, done) => {
  console.log("serializeUser called with user:", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Shopkeeper.findById(id);
    console.log("deserializeUser found user:", user ? user.id : null);
    done(null, user);
  } catch (e) {
    done(e, null);
  }
});

// Set locals middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Middleware helpers
const isLoggedIn = (req, res, next) =>
  req.isAuthenticated() ? next() : res.redirect("/");
const redirectIfLoggedIn = (req, res, next) =>
  req.isAuthenticated() ? res.redirect("/main") : next();
const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Routes

// Auth routes
app.get("/", redirectIfLoggedIn, (req, res) => res.render("user/login"));
app.get("/signup", redirectIfLoggedIn, (req, res) => res.render("user/signup"));

app.post(
  "/signup",
  catchAsync(async (req, res, next) => {
    const { email, password, name, shopname, location, city } = req.body;
    try {
      const newShopkeeper = new Shopkeeper({ email, name, shopname, location, city });
      await Shopkeeper.register(newShopkeeper, password);
      req.login(newShopkeeper, (err) => {
        if (err) {
          console.log("req.login error after signup:", err);
          return next(err);
        }
        req.flash("success", `Welcome, ${req.user.name}!`);
        res.redirect("/main");
      });
    } catch (err) {
      if (err.name === "UserExistsError") {
        req.flash("error", "An account with that email already exists. Please log in instead.");
        return res.redirect("/");
      }
      req.flash("error", err.message);
      res.redirect("/signup");
    }
  })
);

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/",
    failureFlash: true,
  }),
  (req, res) => {
    console.log("User logged in:", req.user);
    req.flash("success", `Welcome back, ${req.user.name}!`);
    res.redirect("/main");
  }
);

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/");
  });
});

// Main dashboard and other routes (same as your code)...

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  if (res.headersSent) return next(err);
  req.flash("error", err.message || "Something went wrong!");
  res.redirect("back");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
