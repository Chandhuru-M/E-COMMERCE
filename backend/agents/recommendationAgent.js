const Product = require("../models/productModel");

module.exports = {
  getRecommendations: async (query, userHistory) => {
    const q = query.toLowerCase();

    // 🔍 1. Fetch relevant products from DB
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } }
      ]
    });

    // No products found
    if (!products.length) {
      return [];
    }

    // 🎯 2. Apply scoring (AI-like logic)
    const scored = products.map(product => {
      let score = 0;

      // User preference boost
      if (userHistory?.favCategories?.includes(product.category))
        score += 0.4;

      if (userHistory?.favColors?.includes(product.color))
        score += 0.3;

      // Trend boost (optional static example)
      const trendingCategories = ["watch", "tshirt", "shoes"];
      const trendingColors = ["black", "blue", "white"];

      if (trendingCategories.includes(product.category.toLowerCase()))
        score += 0.2;

      if (trendingColors.includes(product.color?.toLowerCase()))
        score += 0.1;

      return { product, score };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Return only top 5
    return scored.slice(0, 5).map(item => item.product);
  }
};

