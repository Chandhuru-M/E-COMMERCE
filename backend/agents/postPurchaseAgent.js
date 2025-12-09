const Order = require("../models/orderModel");

module.exports = {
  // Auto triggered after delivery
  trigger: async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    order.postPurchaseStatus = "Pending Feedback";
    await order.save();

    console.log(`PostPurchaseAgent triggered for Order ${orderId}`);

    return {
      success: true,
      message: "Post purchase flow started"
    };
  },

  // User submits feedback
  submitFeedback: async (orderId, rating, comment) => {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    order.feedback = { rating, comment };
    order.postPurchaseStatus = "Completed";

    await order.save();

    return {
      success: true,
      message: "Feedback submitted successfully"
    };
  },

  // Return / Complaint flow
  raiseIssue: async (orderId, issueType, description) => {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    order.issue = { issueType, description };
    order.postPurchaseStatus = "Issue Raised";

    await order.save();

    return {
      success: true,
      message: "Issue raised successfully"
    };
  }
};
