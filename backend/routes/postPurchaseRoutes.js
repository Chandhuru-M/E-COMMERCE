const express = require("express");
const router = express.Router();
const postPurchaseAgent = require("../agents/postPurchaseAgent");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

// Submit feedback
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
