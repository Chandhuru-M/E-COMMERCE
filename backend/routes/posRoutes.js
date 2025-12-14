// // routes/posRoutes.js
// const express = require('express');
// const router = express.Router();
// const posController = require('../controllers/posController');


// router.post('/scan', posController.scanBarcode);
// router.post('/remove', posController.removeItem);
// router.post('/checkout', posController.checkout);


// module.exports = router;
const router = require("express").Router();
const posController = require("../controllers/posController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

// POS routes - require authentication and merchant/staff roles
router.post("/scan", isAuthenticatedUser, authorizeRoles('merchant_admin', 'staff', 'admin'), posController.scanBarcode);
router.post("/remove", isAuthenticatedUser, authorizeRoles('merchant_admin', 'staff', 'admin'), posController.removeItem);
router.post("/checkout", isAuthenticatedUser, authorizeRoles('merchant_admin', 'staff', 'admin'), posController.checkoutPOS);

module.exports = router;