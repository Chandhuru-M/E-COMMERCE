const express = require("express");
const router = express.Router();
const salesAgent = require("../agents/salesAgent");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

let session = {}; // temporary session

router.post("/assistant", isAuthenticatedUser, async (req, res) => {
  const { message } = req.body;

  session.user = req.user;
  session.cart = session.cart || [];

  const response = await salesAgent.handleUserMessage(message, session);

  res.json(response);
});

module.exports = router;
