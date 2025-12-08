// const express = require("express");
// const router = express.Router();
// const loyaltyAgent = require("../agents/loyaltyAgent");

// router.post("/apply-offers", (req, res) => {
//   const { user, product, couponCode } = req.body;

//   const result = loyaltyAgent.applyLoyaltyAndOffers(user, product, couponCode);
//   res.json(result);
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const loyaltyAgent = require("../agents/loyaltyAgent");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

router.post("/apply-offers", isAuthenticatedUser, async (req, res) => {
  const { product, couponCode } = req.body;
  const userId = req.user._id;

  const result = await loyaltyAgent.applyLoyaltyAndOffers(
    userId,
    product,
    couponCode
  );

  res.json(result);
});

module.exports = router;

