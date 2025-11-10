const passport = require("passport");
const LocalStrategy = require("passport-local");
const Shopkeeper = require("../models/Shopkeeper");

passport.use(new LocalStrategy({ usernameField: "email" }, Shopkeeper.authenticate()));
passport.serializeUser(Shopkeeper.serializeUser());
passport.deserializeUser(Shopkeeper.deserializeUser());

module.exports = passport;
