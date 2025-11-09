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

// Set view engine and views directory
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static assets
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse JSON and urlencoded form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Enable HTTP verbs like PUT and DELETE with query param _method
app.use(methodOverride("_method"));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Configure multer for image uploads to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "shopkeeper-items",
    allowed_formats: ["jpeg", "png", "jpg", "gif"],
  },
});
const upload = multer({ storage });

// MongoDB Atlas connection string with TLS enabled
const connectionString = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority&tls=true`;

// Connect to MongoDB Atlas
async function connectDB() {
  try {
    await mongoose.connect(connectionString);
    console.log("MongoDB Atlas Connected");
  } catch (e) {
    console.error("MongoDB Connection Error:", e);
    setTimeout(connectDB, 5000);
  }
}
connectDB();

// Configure session store backed by MongoDB for production-ready sessions
const sessionStore = MongoStore.create({
  mongoUrl: connectionString,
  collectionName: "sessions",
  ttl: 14 * 24 * 60 * 60, // 14 days
});

// Setup session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

// Initialize flash message middleware
app.use(flash());

// Initialize Passport and session middleware
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({ usernameField: "email" }, Shopkeeper.authenticate()));

// Passport user serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await Shopkeeper.findById(id);
    done(null, user);
  } catch (e) {
    done(e);
  }
});

// Middleware to make variables accessible in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Helper middlewares to check authentication status
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
  catchAsync(async (req, res) => {
    const { email, password, name, shopname, location, city } = req.body;
    try {
      const newShopkeeper = new Shopkeeper({ email, name, shopname, location, city });
      await Shopkeeper.register(newShopkeeper, password);
      req.login(newShopkeeper, (err) => {
        if (err) throw err;
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
    failureRedirect: "/main",
    failureFlash: true,
  }),
  (req, res) => {
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

// Main dashboard
app.get(
  "/main",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
    const items = shopkeeper.items || [];
    const categories = [...new Set(items.map((i) => i.category))];
    res.render("listings/index", { shopkeeper, items, categories });
  })
);

// Categories listing filtered by query
app.get(
  "/main/categories",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
    let items = shopkeeper.items || [];
    const categories = [...new Set(items.map((i) => i.category))];
    if (req.query.q && req.query.q !== "all") {
      items = items.filter((i) => i.category === req.query.q);
    }
    res.render("listings/category", { shopkeeper, items, categories, q: req.query.q || "all" });
  })
);

// Delete item from category
app.delete(
  "/main/categories/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    const shopkeeper = await Shopkeeper.findById(req.user._id);
    shopkeeper.items = shopkeeper.items.filter((id) => id.toString() !== req.params.id);
    await shopkeeper.save();
    req.flash("success", "Item deleted successfully!");
    res.redirect("/main/categories");
  })
);

// Dashboard stats
app.get(
  "/main/dashboard",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const stats = {
      totalSalesAmount: Math.floor(Math.random() * (200000 - 100000 + 1)) + 100000,
      totalTransactions: Math.floor(Math.random() * 41) + 10,
      totalStock: Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
      uniqueCustomers: Math.floor(Math.random() * 26) + 5,
    };

    const salesTrend = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      salesTrend.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        amount: Math.floor(Math.random() * (15000 - 2000 + 1)) + 2000,
      });
    }

    const topSelling = [
      { name: "Demo Product 1", soldQty: Math.floor(Math.random() * 16) + 5 },
      { name: "Demo Product 2", soldQty: Math.floor(Math.random() * 14) + 2 },
      { name: "Demo Product 3", soldQty: Math.floor(Math.random() * 10) + 1 },
      { name: "Demo Product 4", soldQty: Math.floor(Math.random() * 8) + 1 },
      { name: "Demo Product 5", soldQty: Math.floor(Math.random() * 5) + 1 },
    ];

    const monthsData = [];
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    for (let m = 0; m < 12; m++) {
      monthsData.push({
        month: `${monthNames[m]} 2025`,
        sales: Math.floor(Math.random() * (200000 - 100000 + 1)) + 100000,
        profit: Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000,
        change: Math.floor(Math.random() * 15) - 7,
        topProduct: `Product ${m + 1}`,
      });
    }

    res.render("listings/dashboard", { stats, salesTrend, topSelling, monthsData });
  })
);

// Orders routes
app.get(
  "/main/order",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const shopkeeper = await Shopkeeper.findById(req.user._id).populate("myorder");
    res.render("listings/myorder", { orders: shopkeeper.myorder });
  })
);

app.delete(
  "/main/order/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const shopkeeper = await Shopkeeper.findById(req.user._id);
    shopkeeper.myorder = shopkeeper.myorder.filter((order) => order._id.toString() !== req.params.id);
    await shopkeeper.save();
    req.flash("success", "Order deleted successfully!");
    res.redirect("/main/order");
  })
);

// Item details & update
app.get(
  "/main/show/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const details = await Item.findById(req.params.id);
    if (!details) {
      req.flash("error", "Item not found");
      return res.redirect("/main");
    }
    const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
    res.render("listings/show", { details, items: shopkeeper.items });
  })
);

app.post(
  "/main/show/:id",
  isLoggedIn,
  upload.single("image"),
  catchAsync(async (req, res) => {
    const {
      name,
      brand,
      category,
      subCategory,
      costPrice,
      sellingPrice,
      discount,
      stock,
      unit,
      description,
    } = req.body;

    const details = await Item.findById(req.params.id);
    if (!details) {
      req.flash("error", "Item not found");
      return res.redirect("/main");
    }

    details.name = name || details.name;
    details.brand = brand || details.brand;
    details.category = category || details.category;
    details.subCategory = subCategory || details.subCategory;
    details.costPrice = costPrice || details.costPrice;
    details.sellingPrice = sellingPrice || details.sellingPrice;
    details.discount = discount || details.discount;
    details.stock = stock || details.stock;
    details.unit = unit || details.unit;
    details.description = description || details.description;

    if (req.file) {
      details.image = req.file.path;
    }

    await details.save();

    const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
    req.flash("success", "Item updated successfully!");
    res.render("listings/show", { details, items: shopkeeper.items });
  })
);

// Edit item form
app.get(
  "/main/edit/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const details = await Item.findById(req.params.id);
    if (!details) {
      req.flash("error", "Item not found");
      return res.redirect("/main");
    }
    res.render("listings/editlist", { details });
  })
);

// Add new list form
app.get(
  "/addlist",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
    res.render("listings/addlist", { items: shopkeeper.items });
  })
);

// Create new item
app.post(
  "/main",
  isLoggedIn,
  upload.single("image"),
  catchAsync(async (req, res) => {
    const { name, costPrice, sellingPrice, category } = req.body;
    const image = req.file ? req.file.path : "";

    if (!name || !costPrice || !sellingPrice) {
      req.flash("error", "Name, costPrice, and sellingPrice are required!");
      return res.redirect("/addlist");
    }
    const newItem = await Item.create({ name, costPrice, sellingPrice, category, image });
    const shopkeeper = await Shopkeeper.findById(req.user._id);
    shopkeeper.items.push(newItem._id);
    await shopkeeper.save();

    req.flash("success", "Item added successfully!");
    res.redirect("/main");
  })
);

// Delete item
app.delete(
  "/main/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    const shopkeeper = await Shopkeeper.findById(req.user._id);
    shopkeeper.items = shopkeeper.items.filter((id) => id.toString() !== req.params.id);
    await shopkeeper.save();
    req.flash("success", "Item deleted successfully!");
    res.redirect("/main");
  })
);

// Buy item routes
app.get(
  "/buyItem/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const orderedItem = await Item.findById(req.params.id);
    if (!orderedItem) {
      req.flash("error", "Item not found");
      return res.redirect("/main");
    }
    res.render("listings/buyItem", { orderedItem });
  })
);

app.post(
  "/buyItem/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const qty = parseInt(req.body.quantity);
    const item = await Item.findById(req.params.id);
    const shopkeeper = await Shopkeeper.findById(req.user._id);
    shopkeeper.myorder.push({
      item: req.params.id,
      quantity: qty,
      image: item.image,
      title: item.title,
      price: item.price,
    });
    await shopkeeper.save();
    req.flash("success", "Item purchased successfully!");
    res.redirect("/main/show/" + req.params.id);
  })
);

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
