const express = require("express");
const { chatAssistant } = require("../controllers/assistantController");
const router = express.Router();

router.route("/assistant").post(chatAssistant);

module.exports = router;
