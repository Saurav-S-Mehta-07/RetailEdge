const Shopkeeper = require("../models/Shopkeeper");

exports.renderLogin = (req, res) => res.render("user/login");
exports.renderSignup = (req, res) => res.render("user/signup");

exports.signup = async (req, res) => {
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
      req.flash("error", "Email already exists. Please log in.");
      return res.redirect("/");
    }
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

exports.login = (req, res) => {
  req.flash("success", `Welcome back, ${req.user.name}!`);
  res.redirect("/main");
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/");
  });
};
