const express = require("express");
const router = express.Router();
const postPurchaseAgent = require("../agents/postPurchaseAgent");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

// Trigger post-purchase flow (called after order completion)
router.post("/trigger", isAuthenticatedUser, async (req, res) => {
  const { orderId } = req.body;
  const response = await postPurchaseAgent.trigger(orderId);
  res.json(response);
});

// Submit feedback with orderId in URL
router.put("/feedback/:id", isAuthenticatedUser, async (req, res) => {
  const orderId = req.params.id;
  const { rating, message } = req.body;
  const response = await postPurchaseAgent.submitFeedback(orderId, rating, message);
  res.json(response);
});

// Request return with orderId in URL
router.put("/request-return/:id", isAuthenticatedUser, async (req, res) => {
  const orderId = req.params.id;
  const { reason } = req.body;
  const response = await postPurchaseAgent.requestReturn(orderId, reason);
  res.json(response);
});

// Report issue with orderId in URL
router.put("/report-issue/:id", isAuthenticatedUser, async (req, res) => {
  const orderId = req.params.id;
  const { issue } = req.body;
  const response = await postPurchaseAgent.reportIssue(orderId, issue);
  res.json(response);
});

// Legacy POST routes (keep for backward compatibility)
router.post("/feedback", isAuthenticatedUser, async (req, res) => {
  const { orderId, rating, comment } = req.body;
  const response = await postPurchaseAgent.submitFeedback(orderId, rating, comment);
  res.json(response);
});

// Raise issue / return request
router.post("/issue", isAuthenticatedUser, async (req, res) => {
  const { orderId, issueType, description } = req.body;
  const response = await postPurchaseAgent.raiseIssue(orderId, issueType, description);
  res.json(response);
});

module.exports = router;
