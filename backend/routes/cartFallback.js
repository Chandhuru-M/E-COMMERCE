// routes/cartFallback.js
const express = require("express");
const router = express.Router();

// Minimal add-to-cart fallback
router.post("/add", async (req, res) => {
  try {
    // Ideally call your actual cart service instead of doing nothing.
    // For now, accept the request and return a success reply (so frontend flow continues).
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ success:false, message: "productId required" });

    // TODO: call your real cart controller/service here
    return res.json({ success: true, message: "added (fallback)", cartItem: { productId, quantity } });
  } catch (err) {
    return res.status(500).json({ success:false, message: err.message });
  }
});

module.exports = router;
