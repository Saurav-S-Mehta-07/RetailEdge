const Item = require("../models/Item");
const Shopkeeper = require("../models/Shopkeeper");

exports.showOrders = async (req, res) => {
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("myorder");
  res.render("listings/myorder", { orders: shopkeeper.myorder });
};

exports.deleteOrder = async (req, res) => {
  const shopkeeper = await Shopkeeper.findById(req.user._id);
  shopkeeper.myorder = shopkeeper.myorder.filter(
    (order) => order._id.toString() !== req.params.id
  );
  await shopkeeper.save();
  req.flash("success", "Order deleted successfully!");
  res.redirect("/main/order");
};

exports.buyItemForm = async (req, res) => {
  const orderedItem = await Item.findById(req.params.id);
  if (!orderedItem) {
    req.flash("error", "Item not found");
    return res.redirect("/main");
  }
  res.render("listings/buyItem", { orderedItem });
};

exports.buyItem = async (req, res) => {
  const qty = parseInt(req.body.quantity);
  const item = await Item.findById(req.params.id);
  const shopkeeper = await Shopkeeper.findById(req.user._id);
  shopkeeper.myorder.push({
    item: req.params.id,
    quantity: qty,
    image: item.image,
    title: item.name,
    price: item.sellingPrice,
  });
  await shopkeeper.save();
  req.flash("success", "Item purchased successfully!");
  res.redirect(`/main/show/${req.params.id}`);
};
