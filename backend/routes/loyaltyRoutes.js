const express = require("express");
const router = express.Router();
const loyaltyAgent = require("../agents/loyaltyAgent");

router.post("/apply-offers", (req, res) => {
  const { user, product, couponCode } = req.body;

  const result = loyaltyAgent.applyLoyaltyAndOffers(user, product, couponCode);
  res.json(result);
});

module.exports = router;
