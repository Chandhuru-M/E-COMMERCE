// const express = require("express");
// const router = express.Router();
// const { getRecommendationsController } = require("../controllers/recommendController");

// router.post("/recommend", getRecommendationsController);

// module.exports = router;
// routes/recommendRoutes.js
const express = require("express");
const router = express.Router();
const recController = require("../controllers/recommendController");
const { isAuthenticatedUser } = require("../middlewares/authenticate"); // reuse your auth

// search (personalized)
router.post("/recommend/search", isAuthenticatedUser, recController.searchController);

// save FakeStore product to DB
router.post("/recommend/save", isAuthenticatedUser, recController.saveSelectedProduct);

// select FakeStore product to import into DB (Sales agent calls this after user OK)
router.post("/recommend/select", isAuthenticatedUser, recController.selectFakeController);

// trending (optional)
router.get("/recommend/trending", isAuthenticatedUser, recController.trendingController);

module.exports = router;
