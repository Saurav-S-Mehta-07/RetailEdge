const mongoose = require("mongoose");

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Atlas Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    setTimeout(() => connectDB(uri), 5000);
  }
}

module.exports = connectDB;
