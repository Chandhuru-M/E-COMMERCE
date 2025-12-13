// models/posCartModel.js
const mongoose = require("mongoose");

const posCartSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: "Merchant" },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: Number,
    price: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("POSCart", posCartSchema);
