const mongoose = require("mongoose");

const adminFeedbackSchema = new mongoose.Schema({
  userId: String,
  orderId: String,
  rating: Number,
  comment: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AdminFeedback", adminFeedbackSchema);
