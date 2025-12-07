const express = require("express");
const router = express.Router();
const paymentAgent = require("../agents/paymentAgent");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

router.post("/start-payment", isAuthenticatedUser, async (req, res) => {
    const { amount, currency, user, orderDetails } = req.body;

    const result = await paymentAgent.processPayment(
        amount,
        currency,
        user,
        orderDetails
    );

    res.json(result);
});

module.exports = router;
