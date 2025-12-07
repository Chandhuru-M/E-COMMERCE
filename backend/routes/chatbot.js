const express = require("express");
const axios = require("axios");
const router = express.Router();

const N8N_URL = "http://localhost:5678/webhook/chatbot";

router.post("/", async (req, res) => {
  console.log("✅ /api/chatbot was hit");

  try {
    const { message } = req.body;
    console.log("User message:", message);

    const response = await axios.post(
      N8N_URL,
      { message },
      { timeout: 10000 }
    );

    console.log("n8n replied:", response.data);

    return res.json(response.data);
  } catch (err) {
    console.log("❌ FULL ERROR:");
    console.log(err.code || err.message);
    console.log(err.response?.data || "No response from n8n");

    return res.status(500).json({
      reply: "Backend can't reach n8n",
    });
  }
});

module.exports = router;
