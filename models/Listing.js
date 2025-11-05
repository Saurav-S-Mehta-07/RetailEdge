const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  // 1️⃣ Product Details
  name: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    trim: true,
  },

  // 2️⃣ Category & Type
  category: {
    type: String,
    required: true,
    trim: true,
  },
  subCategory: {
    type: String,
    default: "",
  },

  // 3️⃣ Pricing
  costPrice: {
    type: Number,
    required: true, // vendor’s purchase cost
  },
  sellingPrice: {
    type: Number,
    required: true, // price sold to customers
  },
  discount: {
    type: Number,
    default: 0, // percentage discount
  },

  // 4️⃣ Stock & Inventory
  stock: {
    type: Number,
    default: 0,
  },
  minStockAlert: {
    type: Number,
    default: 5, // low-stock alert
  },
  unit: {
    type: String,
    default: "pcs", // e.g. pcs, kg, litre
  },

  // 5️⃣ Image & Description
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },

  // 6️⃣ Vendor Details
  vendor: {
    type: String,
  },
  vendorId: {
    type: String,
  },
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
