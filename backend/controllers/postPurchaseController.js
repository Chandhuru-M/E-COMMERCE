// backend/controllers/postPurchaseController.js
const Order = require("../models/orderModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");

// ensure nested object exists
function ensurePostPurchase(order) {
  if (!order.postPurchase) {
    order.postPurchase = {
      returnRequested: false,
      feedback: "",
      issueReported: "",
      status: "none"
    };
  }
}

// 1) Request Return
exports.requestReturn = catchAsyncError(async (req, res, next) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.orderId);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  ensurePostPurchase(order);

  order.postPurchase.returnRequested = true;
  order.postPurchase.returnReason = reason;
  order.postPurchase.status = "return_requested";
  order.postPurchaseNotes = (order.postPurchaseNotes || "") + \nReturn requested: ${reason};

  await order.save();

  res.status(200).json({ success: true, message: "Return request submitted", order });
});

// 2) Submit Feedback
exports.submitFeedback = catchAsyncError(async (req, res, next) => {
  const { rating, message } = req.body;
  const order = await Order.findById(req.params.orderId);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  ensurePostPurchase(order);
  order.postPurchase.feedback = JSON.stringify({ rating, message, at: new Date() });
  order.postPurchase.status = "feedback_submitted";
  order.postPurchaseNotes = (order.postPurchaseNotes || "") + \nFeedback: ${rating} / ${message};

  await order.save();

  res.status(200).json({ success: true, message: "Feedback recorded", order });
});

// 3) Report Issue
exports.reportIssue = catchAsyncError(async (req, res, next) => {
  const { issue } = req.body;
  const order = await Order.findById(req.params.orderId);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  ensurePostPurchase(order);
  order.postPurchase.issueReported = issue;
  order.postPurchase.status = "issue_reported";
  order.postPurchaseNotes = (order.postPurchaseNotes || "") + \nIssue reported: ${issue};

  await order.save();

  res.status(200).json({ success: true, message: "Issue reported", order });
});

// 4) Get Post-Purchase Status Summary
exports.getPostPurchaseStatus = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  ensurePostPurchase(order);
  res.status(200).json({ success: true, postPurchase: order.postPurchase, notes: order.postPurchaseNotes || "" });
});