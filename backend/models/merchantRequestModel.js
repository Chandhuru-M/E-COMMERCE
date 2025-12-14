const mongoose = require("mongoose");

module.exports = mongoose.model(
  "MerchantRequest",
  new mongoose.Schema({
    ownerName: String,
    storeName: String,
    email: String,
    phone: String,
    licenseNumber: String,
    status: { type: String, default: "pending" }
  }, { timestamps: true })
);
