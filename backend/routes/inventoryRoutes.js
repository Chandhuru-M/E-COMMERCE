const express = require("express");
const router = express.Router();
const inventoryAgent = require("../agents/inventoryAgent");

router.post("/inventory-check", async (req, res) => {
    const { sku } = req.body;
    const result = await inventoryAgent.checkInventory(sku);
    res.json(result);
});

module.exports = router;
