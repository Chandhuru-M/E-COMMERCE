// models/merchantModel.js
const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema({
  storeName: String,
  email: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  status: { type: String, default: "ACTIVE" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Merchant", merchantSchema);
