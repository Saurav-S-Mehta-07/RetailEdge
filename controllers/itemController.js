const mongoose = require("mongoose");
const Item = require("../models/Item");
const Shopkeeper = require("../models/Shopkeeper");

exports.renderAddItem = async (req, res, next) => {
  try {
    const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
    res.render("listings/addlist", { items: shopkeeper.items });
  } catch (err) {
    next(err);
  }
};

exports.createItem = async (req, res, next) => {
  try {
    const { name, costPrice, sellingPrice, category } = req.body;
    const image = req.file ? req.file.path : "";

    if (!name || !costPrice || !sellingPrice) {
      req.flash("error", "Name, costPrice, and sellingPrice are required!");
      return res.redirect("/addlist");
    }

    const newItem = await Item.create({
      name,
      costPrice,
      sellingPrice,
      category,
      image,
    });

    const shopkeeper = await Shopkeeper.findById(req.user._id);
    shopkeeper.items.push(newItem._id);
    await shopkeeper.save();

    req.flash("success", "Item added successfully!");
    res.redirect("/main");
  } catch (err) {
    next(err);
  }
};

exports.showItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid item link or missing ID.");
      return res.redirect("/main");
    }

    const details = await Item.findById(id);
    if (!details) {
      req.flash("error", "Item not found!");
      return res.redirect("/main");
    }

    const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
    res.render("listings/show", { details, items: shopkeeper.items });
  } catch (err) {
    next(err);
  }
};


exports.renderEditItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid Item ID");
      error.status = 404;
      return next(error);
    }

    const details = await Item.findById(id);
    if (!details) return res.status(404).render("404");

    res.render("listings/editlist", { details });
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid Item ID");
      error.status = 404;
      return next(error);
    }

    const details = await Item.findById(id);
    if (!details) return res.status(404).render("404");

    Object.assign(details, req.body);
    if (req.file) details.image = req.file.path;
    await details.save();

    const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
    req.flash("success", "Item updated successfully!");
    res.render("listings/show", { details, items: shopkeeper.items });
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid Item ID");
      error.status = 404;
      return next(error);
    }

    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) return res.status(404).render("404");

    const shopkeeper = await Shopkeeper.findById(req.user._id);
    shopkeeper.items = shopkeeper.items.filter(
      (itemId) => itemId.toString() !== id
    );
    await shopkeeper.save();

    req.flash("success", "Item deleted successfully!");
    res.redirect("/main");
  } catch (err) {
    next(err);
  }
};
