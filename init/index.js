const mongoose = require("mongoose");
const initData = require("./data.js"); // ✅ data.js in the same folder
const Shopkeeper = require("../models/Shopkeeper.js"); // ✅ go up one level, then into models

main()
  .then(() => console.log("✅ MongoDB connection successful"))
  .catch((err) => console.log("❌ Connection error:", err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/RetailerDB");
}

const initDB = async () => {
  try {
    await Shopkeeper.deleteMany({});
    await Shopkeeper.insertMany(initData.data);
    console.log("✅ Shopkeeper data initialized successfully");
  } catch (err) {
    console.error("❌ Error initializing Shopkeeper data:", err);
  } finally {
    mongoose.connection.close();
  }
};

initDB();
