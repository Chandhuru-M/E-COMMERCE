
const express = require("express");
const { reserveStock, confirmInventory } = require("../controllers/inventoryController");

const router = express.Router();

// Reserve stock before payment
router.post("/reserve", reserveStock);

// Confirm reservation after payment
router.post("/confirm", confirmInventory);

module.exports = router;
