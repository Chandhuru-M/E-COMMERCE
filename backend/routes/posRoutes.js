// routes/posRoutes.js
const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');


router.post('/scan', posController.scanBarcode);
router.post('/remove', posController.removeItem);
router.post('/checkout', posController.checkout);


module.exports = router;