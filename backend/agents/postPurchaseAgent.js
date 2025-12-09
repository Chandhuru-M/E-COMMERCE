// const Order = require("../models/orderModel");

// module.exports = {
//   // Auto triggered after delivery
//   trigger: async (orderId) => {
//     const order = await Order.findById(orderId);
//     if (!order) return { error: "Order not found" };

//     order.postPurchaseStatus = "Pending Feedback";
//     await order.save();

//     console.log(`PostPurchaseAgent triggered for Order ${orderId}`);

//     return {
//       success: true,
//       message: "Post purchase flow started"
//     };
//   },

//   // User submits feedback
//   submitFeedback: async (orderId, rating, comment) => {
//     const order = await Order.findById(orderId);
//     if (!order) return { error: "Order not found" };

//     order.feedback = { rating, comment };
//     order.postPurchaseStatus = "Completed";

//     await order.save();

//     return {
//       success: true,
//       message: "Feedback submitted successfully"
//     };
//   },

//   // Return / Complaint flow
//   raiseIssue: async (orderId, issueType, description) => {
//     const order = await Order.findById(orderId);
//     if (!order) return { error: "Order not found" };

//     order.issue = { issueType, description };
//     order.postPurchaseStatus = "Issue Raised";

//     await order.save();

//     return {
//       success: true,
//       message: "Issue raised successfully"
//     };
//   }
// };
// const Order = require("../models/orderModel");

// module.exports = {
//   trigger: async (orderId) => {
//     const order = await Order.findById(orderId);
//     if (!order) return { error: "Order not found" };

//     order.postPurchaseStatus = "Pending Feedback";
//     await order.save();

//     console.log("PostPurchaseAgent activated");

//     return { success: true, message: "Post purchase flow started" };
//   },

//   submitFeedback: async (orderId, rating, comment) => {
//     const order = await Order.findById(orderId);
//     if (!order) return { error: "Order not found" };

//     order.feedback = { rating, comment, date: new Date() };
//     order.postPurchaseStatus = "Completed";

//     await order.save();

//     return { success: true, message: "Feedback saved" };
//   },

//   raiseIssue: async (orderId, issueType, description) => {
//     const order = await Order.findById(orderId);
//     if (!order) return { error: "Order not found" };

//     order.issue = { issueType, description };
//     order.postPurchaseStatus = "Issue Raised";

//     await order.save();

//     return { success: true, message: "Issue recorded" };
//   },
// };
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const AdminFeedback = require("../models/AdminFeedback");

module.exports = {
  trigger: async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    order.postPurchaseStatus = "Pending Feedback";
    await order.save();

    return { success: true, message: "Post purchase flow started" };
  },

  submitFeedback: async (orderId, rating, comment, userId) => {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    // Save in order
    order.feedback = { rating, comment, date: new Date() };
    order.postPurchaseStatus = "Completed";
    await order.save();

    // Save in user
    await User.findByIdAndUpdate(userId, {
      $push: {
        feedbacks: { orderId, rating, comment }
      }
    });

    // Save in admin collection
    await AdminFeedback.create({
      userId,
      orderId,
      rating,
      comment
    });

    return { success: true, message: "Feedback submitted" };
  },

  raiseIssue: async (orderId, issueType, description) => {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    order.issue = { issueType, description };
    order.postPurchaseStatus = "Issue Raised";

    await order.save();

    return { success: true, message: "Issue recorded" };
  },
};
