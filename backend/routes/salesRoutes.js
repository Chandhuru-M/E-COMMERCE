// routes/salesRoutes.js
const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const { isAuthenticatedUser } = require("../middlewares/authenticate"); // your existing auth middleware

router.post("/sales/parse-search", isAuthenticatedUser, salesController.parseAndSearch);
router.post("/sales/select", isAuthenticatedUser, salesController.select);
router.post("/sales/add-to-cart", isAuthenticatedUser, salesController.addToCart);
router.get("/sales/cart-summary", isAuthenticatedUser, salesController.getCartSummary);
router.post("/sales/start-payment", isAuthenticatedUser, salesController.startPayment);
router.post("/sales/checkout", isAuthenticatedUser, salesController.checkout);
router.post("/sales/complete", isAuthenticatedUser, salesController.complete);

module.exports = router;
