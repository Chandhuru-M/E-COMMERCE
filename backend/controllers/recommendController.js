const RecommendationEngine = require("../services/recommendationEngine");
const User = require("../models/userModel");
const Order = require("../models/orderModel");

exports.getRecommendationsController = async (req, res) => {
  try {
    const { query, userId } = req.body;

    if (!query)
      return res.status(400).json({ success: false, message: "Query required" });

    let userHistory = {
      favCategories: [],
      favColors: [],
      relatedProducts: [],
      avgPrice: null
    };

    // 1️⃣ Fetch user history
    if (userId) {
      const orders = await Order.find({ user: userId }).populate("orderItems.product");

      const categories = new Set();
      const colors = new Set();
      const related = new Set();
      let totalPrice = 0;
      let itemCount = 0;

      for (const order of orders) {
        for (const item of order.orderItems) {
          const prod = item.product;
          if (!prod) continue;

          if (prod.category) categories.add(prod.category);
          if (prod.color) colors.add(prod.color);

          related.add(String(prod._id));

          totalPrice += prod.price;
          itemCount++;
        }
      }

      userHistory.favCategories = [...categories];
      userHistory.favColors = [...colors];
      userHistory.relatedProducts = [...related];
      userHistory.avgPrice = itemCount ? totalPrice / itemCount : null;
    }

    // 2️⃣ Get AI-based recommendations
    const recommendations = await RecommendationEngine.getRecommendations(query, userHistory);

    res.status(200).json({
      success: true,
      recommendations,
      count: recommendations.length
    });

  } catch (error) {
    console.error("Recommendation Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
