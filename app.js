const express = require("express");
const path = require("path");
const engine = require("ejs-mate");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");

const Item = require("./models/Item");
const Shopkeeper = require("./models/Shopkeeper");
const { count } = require("console");

const app = express();
const PORT = 3000;

// View engine & static
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

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
  if (req.query.q && req.query.q !== "all") items = items.filter(i => i.category === req.query.q);
  res.render("listings/index", { shopkeeper, items, categories, q: req.query.q || "all" });
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
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
  res.render("listings/show", { details, items: shopkeeper.items });
}));


app.post("/main/show/:id", isLoggedIn, catchAsync(async (req, res) => {
  const { title, price, category, image, discount, stock, rating, quantity } = req.body;

  // Find item by ID
  let details = await Item.findById(req.params.id);
  if (!details) return res.status(404).send("Item not found");

  // Update fields
  details.title = title;
  details.price = price;
  details.category = category;
  details.discount = discount;
  details.stock = stock;
  details.rating = rating;
  details.image = image;
  details.quantity = quantity;

  // Save the updated item
  await details.save();

  // Get shopkeeper items for the page
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");

  // Redirect or render updated show page
  res.render("listings/show", { details, items: shopkeeper.items });
}));


//edit list
app.get("/main/edit/:id",isLoggedIn, catchAsync(async(req,res)=>{
    const details = await Item.findById(req.params.id);
    res.render("listings/editlist",{details})
}));

app.get("/addlist", isLoggedIn, catchAsync(async (req, res) => {
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
  res.render("listings/addlist", { items: shopkeeper.items });
}));

app.post("/main", isLoggedIn, catchAsync(async (req, res) => {
  const { title, price, category, image } = req.body;
  const newItem = await Item.create({ title, price, category, image });
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
