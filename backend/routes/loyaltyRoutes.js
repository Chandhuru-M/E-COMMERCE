const express = require('express');
const router = express.Router();
const { checkLoyalty, applyLoyalty, finalizeLoyalty } = require('../controllers/loyaltyController');
const { isAuthenticatedUser } = require('../middlewares/authenticate');

// Mounted at /api/v1/loyalty in app.js
// check requires auth (to show points)
router.get('/check', isAuthenticatedUser, checkLoyalty);

// apply requires auth (we recommend auth) - but you could allow public apply with 0 points
router.post('/apply', isAuthenticatedUser, applyLoyalty);

// finalize must be called after payment; requires auth
router.post('/finalize', isAuthenticatedUser, finalizeLoyalty);

module.exports = router;