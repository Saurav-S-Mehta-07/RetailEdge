const Shopkeeper = require("../models/Shopkeeper");

exports.renderDashboard = async (req, res) => {
  const shopkeeper = await Shopkeeper.findById(req.user._id).populate("items");
  const items = shopkeeper.items || [];
  const categories = [...new Set(items.map((i) => i.category))];
  res.render("listings/index", { shopkeeper, items, categories });
};

exports.renderAnalytics = async (req, res) => {
  const stats = {
    totalSalesAmount: Math.floor(Math.random() * (200000 - 100000)) + 100000,
    totalTransactions: Math.floor(Math.random() * 41) + 10,
    totalStock: Math.floor(Math.random() * (1000 - 500)) + 500,
    uniqueCustomers: Math.floor(Math.random() * 26) + 5,
  };

  const today = new Date();
  const salesTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: Math.floor(Math.random() * (15000 - 2000)) + 2000,
    };
  });

  const topSelling = Array.from({ length: 5 }, (_, i) => ({
    name: `Demo Product ${i + 1}`,
    soldQty: Math.floor(Math.random() * 16) + 1,
  }));

  const monthsData = Array.from({ length: 12 }, (_, m) => ({
    month: new Date(2025, m).toLocaleString("default", { month: "short" }) + " 2025",
    sales: Math.floor(Math.random() * (200000 - 100000)) + 100000,
    profit: Math.floor(Math.random() * (50000 - 10000)) + 10000,
    change: Math.floor(Math.random() * 15) - 7,
    topProduct: `Product ${m + 1}`,
  }));

  res.render("listings/dashboard", { stats, salesTrend, topSelling, monthsData });
};
