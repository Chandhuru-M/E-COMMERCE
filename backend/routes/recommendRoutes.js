const express = require("express");
const router = express.Router();
const { getRecommendationsController } = require("../controllers/recommendController");

router.post("/recommend", getRecommendationsController);

module.exports = router;
