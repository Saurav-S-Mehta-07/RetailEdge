module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) return res.redirect("/");
  next();
};

module.exports.redirectIfLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return res.redirect("/main");
  next();
};
