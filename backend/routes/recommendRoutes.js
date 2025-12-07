const express = require("express");
const router = express.Router();
const recAgent = require("../agents/recommendationAgent");

router.post("/recommend", (req, res) => {
    const { query, userHistory } = req.body;
    const output = recAgent.getRecommendations(query, userHistory);
    res.json(output);
});

module.exports = router;
