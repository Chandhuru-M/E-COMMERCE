const express = require("express");
const router = express.Router();
const fulfillmentAgent = require("../agents/fulfillmentAgent");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

router.post("/schedule-delivery", isAuthenticatedUser, (req, res) => {
  const { order } = req.body;

  const result = fulfillmentAgent.scheduleDelivery(order);

  res.json(result);
});

module.exports = router;
