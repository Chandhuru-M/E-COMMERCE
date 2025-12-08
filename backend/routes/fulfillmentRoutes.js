// const express = require("express");
// const router = express.Router();
// const fulfillmentAgent = require("../agents/fulfillmentAgent");
// const { isAuthenticatedUser } = require("../middlewares/authenticate");

// router.post("/schedule-delivery", isAuthenticatedUser, (req, res) => {
//   const { order } = req.body;

//   const result = fulfillmentAgent.scheduleDelivery(order);

//   res.json(result);
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const fulfillmentAgent = require("../agents/fulfillmentAgent");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

// Schedule delivery after payment success
router.post("/schedule-delivery", isAuthenticatedUser, async (req, res) => {
  const { orderId } = req.body;

  const response = await fulfillmentAgent.scheduleDelivery(orderId);
  res.json(response);
});

// Update tracking
router.post("/update-delivery", async (req, res) => {
  const { orderId, status } = req.body;

  const response = await fulfillmentAgent.updateDeliveryStatus(orderId, status);
  res.json(response);
});

module.exports = router;

