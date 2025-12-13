const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    trim: true,
  },

  category: {
    type: String,
    required: true,
    trim: true,
  },
  subCategory: {
    type: String,
    default: "",
  },

  costPrice: {
    type: Number,
    required: true,
  },
  sellingPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0, 
  },

  stock: {
    type: Number,
    default: 0,
  },
  minStockAlert: {
    type: Number,
    default: 5, 
  },
  unit: {
    type: String,
    default: "pcs", 
  },

  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },

  vendor: {
    type: String,
  },
  vendorId: {
    type: String,
  },
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
