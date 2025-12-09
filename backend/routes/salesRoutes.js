// routes/salesRoutes.js
const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const { isAuthenticatedUser } = require("../middlewares/authenticate"); // your existing auth middleware

router.post("/sales/parse-search", isAuthenticatedUser, salesController.parseAndSearch);
router.post("/sales/select", isAuthenticatedUser, salesController.select);
router.post("/sales/checkout", isAuthenticatedUser, salesController.checkout);
router.post("/sales/complete", isAuthenticatedUser, salesController.complete);

module.exports = router;
