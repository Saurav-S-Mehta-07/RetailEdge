const express = require("express");
const path = require("path");
const engine = require("ejs-mate");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const multer = require("multer"); // for image upload
require('dotenv').config();


const Item = require("./models/Item");
const Shopkeeper = require("./models/Shopkeeper");

const app = express();
const PORT = 3000;

app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

//Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/b2b2c")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// Session
app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true } // 1 month
}));

app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({ usernameField: "email" }, Shopkeeper.authenticate()));
passport.serializeUser(Shopkeeper.serializeUser());
passport.deserializeUser(Shopkeeper.deserializeUser());

// Locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Middleware
const isLoggedIn = (req, res, next) => req.isAuthenticated() ? next() : res.redirect("/");
const redirectIfLoggedIn = (req, res, next) => req.isAuthenticated() ? res.redirect("/main") : next();
const catchAsync = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Routes
app.get("/", redirectIfLoggedIn, (req, res) => res.render("user/login"));
app.get("/signup", redirectIfLoggedIn, (req, res) => res.render("user/signup"));

app.post("/signup", catchAsync(async (req, res) => {
  const { email, password, name, shopname, location, city } = req.body;
  const newShopkeeper = new Shopkeeper({ email, name, shopname, location, city });
  await Shopkeeper.register(newShopkeeper, password);
  req.login(newShopkeeper, err => {
    if (err) throw err;
    req.flash("success", `Welcome, ${req.user.name}!`);
    res.redirect("/main");
  });
}));

app.post("/login", passport.authenticate("local", {
  failureRedirect: "/",
  failureFlash: true
}), (req, res) => {
  req.flash("success", `Welcome back, ${req.user.name}!`);
  res.redirect("/main");
});

app.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/");
  });
});

// Dashboard
app.get("/main", isLoggedIn, catchAsync(async (req, res) => {
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
  let items = shopkeeper.items;
  const categories = [...new Set(items.map(i => i.category))];
  // if (req.query.q && req.query.q !== "all") items = items.filter(i => i.category === req.query.q);
  res.render("listings/index", { shopkeeper, items, categories}); //,q: req.query.q || "all" 
}));

app.get("/main/categories", isLoggedIn, catchAsync(async (req, res) => {
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
  let items = shopkeeper.items;
  const categories = [...new Set(items.map(i => i.category))];
  if (req.query.q && req.query.q !== "all") items = items.filter(i => i.category === req.query.q);
  res.render("listings/category", { shopkeeper, items, categories, q: req.query.q || "all" });
}));

app.delete("/main/categories:id", isLoggedIn, catchAsync(async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  const shopkeeper = await Shopkeeper.findById(req.user._id);
  shopkeeper.items = shopkeeper.items.filter(id => id.toString() !== req.params.id);
  await shopkeeper.save();
  req.flash("success", "Item deleted successfully!");
  res.redirect("/main/categories");
}));
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

app.get("/main/dashboard", isLoggedIn, catchAsync(async (req, res) => {
  // Simulated stats data
  const stats = {
    totalSalesAmount: getRandomInt(100000, 200000),
    totalTransactions: getRandomInt(10, 50),
    totalStock: getRandomInt(500, 1000),
    uniqueCustomers: getRandomInt(5, 30)
  };

  // Simulate sales trend for last 7 days
  const salesTrend = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    salesTrend.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: getRandomInt(2000, 15000)
    });
  }

  // Simulate top 5 selling items data
  const topSelling = [
    { name: 'Demo Product 1', soldQty: getRandomInt(5, 20) },
    { name: 'Demo Product 2', soldQty: getRandomInt(2, 15) },
    { name: 'Demo Product 3', soldQty: getRandomInt(1, 10) },
    { name: 'Demo Product 4', soldQty: getRandomInt(1, 8) },
    { name: 'Demo Product 5', soldQty: getRandomInt(1, 5) }
  ];

  // Simulate month-wise performance data
  const monthsData = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let m = 0; m < 12; m++) {
    monthsData.push({
      month: `${monthNames[m]} 2025`,
      sales: getRandomInt(100000, 200000),
      profit: getRandomInt(10000, 50000),
      change: Math.floor(Math.random() * 15) - 7, // random between -7% to +7%
      topProduct: `Product ${m + 1}`
    });
  }

  res.render('listings/dashboard', { stats, salesTrend, topSelling, monthsData });
}));




// Orders
app.get("/main/order", isLoggedIn, catchAsync(async (req, res) => {
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("myorder");
  res.render("listings/myorder", { orders: shopkeeper.myorder });
}));

app.delete("/main/order/:id", isLoggedIn, catchAsync(async (req, res) => {
  const shopkeeper = await Shopkeeper.findById(req.user._id);
  shopkeeper.myorder = shopkeeper.myorder.filter(order => order._id.toString() !== req.params.id);
  await shopkeeper.save();
  req.flash("success", "Order deleted successfully!");
  res.redirect("/main/order");
}));

// Item Routes
app.get("/main/show/:id", isLoggedIn, catchAsync(async (req, res) => {
  const details = await Item.findById(req.params.id);
  if (!details) {
    req.flash("error", "Item not found");
    return res.redirect("/main");
  }
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
  res.render("listings/show", { details, items: shopkeeper.items });
}));

app.post("/main/show/:id", isLoggedIn, upload.single("image"), catchAsync(async (req, res) => {
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
    description
  } = req.body;

  // Find item by ID
  const details = await Item.findById(req.params.id);
  if (!details) {
    req.flash("error", "Item not found");
    return res.redirect("/main");
  }

  // Update fields if provided
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

  // Update image if uploaded
  if (req.file) {
    details.image = req.file.filename;
  }

  await details.save();

  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
  req.flash("success", "Item updated successfully!");
  res.render("listings/show", { details, items: shopkeeper.items });
}));


// Edit list
app.get("/main/edit/:id", isLoggedIn, catchAsync(async (req, res) => {
  const details = await Item.findById(req.params.id);
  if (!details) {
    req.flash("error", "Item not found");
    return res.redirect("/main");
  }
  res.render("listings/editlist", { details });
}));


app.get("/addlist", isLoggedIn, catchAsync(async (req, res) => {
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
  res.render("listings/addlist", { items: shopkeeper.items });
}));

app.post("/main", isLoggedIn, upload.single("image"), catchAsync(async (req, res) => {
  const { name, costPrice, sellingPrice, category } = req.body; // must match schema
  const image = req.file ? req.file.filename : "";

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
}));


app.delete("/main/:id", isLoggedIn, catchAsync(async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  const shopkeeper = await Shopkeeper.findById(req.user._id);
  shopkeeper.items = shopkeeper.items.filter(id => id.toString() !== req.params.id);
  await shopkeeper.save();
  req.flash("success", "Item deleted successfully!");
  res.redirect("/main");
}));

// Buy Item
app.get("/buyItem/:id", isLoggedIn, catchAsync(async (req, res) => {
  const orderedItem = await Item.findById(req.params.id);
  if (!orderedItem) {
    req.flash("error", "Item not found");
    return res.redirect("/main");
  }
  res.render("listings/buyItem", { orderedItem });
}));
// GET route to render buyItem page
app.get("/buyItem/:id", isLoggedIn, catchAsync(async (req, res) => {
  const orderedItem = await Item.findById(req.params.id);
  if (!orderedItem) {
    req.flash("error", "Item not found");
    return res.redirect("/main");
  }
  res.render("listings/buyItem", { orderedItem });
}));


app.post("/buyItem/:id", isLoggedIn, catchAsync(async (req, res) => {
  const qty = parseInt(req.body.quantity);
  const item = await Item.findById(req.params.id);
  const shopkeeper = await Shopkeeper.findById(req.user._id);
  shopkeeper.myorder.push({ item: req.params.id, quantity: qty, image: item.image, title: item.title, price: item.price });
  await shopkeeper.save();
  req.flash("success", "Item purchased successfully!");
  res.redirect("/main/show/" + req.params.id);
}));




// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  req.flash("error", err.message || "Something went wrong!");
  res.redirect("back");
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
