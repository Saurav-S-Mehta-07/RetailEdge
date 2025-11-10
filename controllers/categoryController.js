const Item = require("../models/Item");
const Shopkeeper = require("../models/Shopkeeper");

exports.showCategories = async (req, res) => {
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
  let items = shopkeeper.items || [];
  const categories = [...new Set(items.map((i) => i.category))];
  if (req.query.q && req.query.q !== "all") {
    items = items.filter((i) => i.category === req.query.q);
  }
  res.render("listings/category", {
    shopkeeper,
    items,
    categories,
    q: req.query.q || "all",
  });
};

exports.deleteCategoryItem = async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  const shopkeeper = await Shopkeeper.findById(req.user._id);
  shopkeeper.items = shopkeeper.items.filter((id) => id.toString() !== req.params.id);
  await shopkeeper.save();
  req.flash("success", "Item deleted successfully!");
  res.redirect("/main/categories");
};
