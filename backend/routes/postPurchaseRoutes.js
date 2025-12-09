// const express = require("express");
// const router = express.Router();
// const postPurchaseAgent = require("../agents/postPurchaseAgent");
// const { isAuthenticatedUser } = require("../middlewares/authenticate");

// // Submit feedback
// router.post("/feedback", isAuthenticatedUser, async (req, res) => {
//   const { orderId, rating, comment } = req.body;
//   const response = await postPurchaseAgent.submitFeedback(orderId, rating, comment);
//   res.json(response);
// });

// // Raise issue / return request
// router.post("/issue", isAuthenticatedUser, async (req, res) => {
//   const { orderId, issueType, description } = req.body;
//   const response = await postPurchaseAgent.raiseIssue(orderId, issueType, description);
//   res.json(response);
// });

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const postPurchaseAgent = require("../agents/postPurchaseAgent");
// const { isAuthenticatedUser } = require("../middlewares/authenticate");

// // Submit Feedback
// router.post("/feedback", isAuthenticatedUser, async (req, res) => {
//   try {
//     const { orderId, rating, comment } = req.body;

//     if (!orderId || !rating || !comment) {
//       return res.json({ error: "Missing fields" });
//     }

//     const response = await postPurchaseAgent.submitFeedback(
//       orderId,
//       rating,
//       comment
//     );

//     res.json(response);
//   } catch (err) {
//     res.json({ error: err.message });
//   }
// });

// // Raise Issue
// router.post("/issue", isAuthenticatedUser, async (req, res) => {
//   try {
//     const { orderId, issueType, description } = req.body;

//     if (!orderId || !issueType || !description) {
//       return res.json({ error: "Missing issue details" });
//     }

//     const response = await postPurchaseAgent.raiseIssue(
//       orderId,
//       issueType,
//       description
//     );

//     res.json(response);
//   } catch (err) {
//     res.json({ error: err.message });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const postPurchaseAgent = require("../agents/postPurchaseAgent");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

// Submit Feedback
router.post("/feedback", isAuthenticatedUser, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating || !comment) {
      return res.json({ error: "Missing fields" });
    }

    const response = await postPurchaseAgent.submitFeedback(
      orderId,
      rating,
      comment,
      req.user.id   // ➜ Pass logged-in user ID
    );

    res.json(response);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Raise Issue (Return request)
router.post("/issue", isAuthenticatedUser, async (req, res) => {
  try {
    const { orderId, issueType, description } = req.body;

    if (!orderId || !issueType || !description) {
      return res.json({ error: "Missing issue details" });
    }

    const response = await postPurchaseAgent.raiseIssue(
      orderId,
      issueType,
      description
    );

    res.json(response);
  } catch (err) {
    res.json({ error: err.message });
  }
});

module.exports = router;
