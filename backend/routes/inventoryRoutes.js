// const express = require("express");
// const router = express.Router();
// const inv = require("../controllers/inventoryController");

// router.post("/inventory/check", inv.checkStock);
// router.post("/inventory/reserve", inv.reserveStock);
// router.post("/inventory/confirm", inv.confirmReservation);
// router.post("/inventory/release", inv.releaseReservation);

// module.exports = router;


// const express = require("express");
// const { reserveStockController } = require("../controllers/inventoryController");
// const router = express.Router();

// router.post("/reserve", reserveStockController);

// module.exports = router;

const express = require("express");
const { reserveStockController } = require("../controllers/inventoryController");

const router = express.Router();

router.post("/reserve", reserveStockController);

module.exports = router;
