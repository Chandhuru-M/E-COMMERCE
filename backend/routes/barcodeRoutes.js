// routes/barcodeRoutes.js
const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcodeController');


router.get('/:code', barcodeController.getByCode); // GET /api/v1/barcode/:code
module.exports = router;