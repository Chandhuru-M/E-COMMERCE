const Product = require("../models/productModel");
const trending = require("../mock/trending.json");

module.exports = {
  getRecommendations: async (query, userHistory) => {
    const q = query.toLowerCase();

    try {
      // Find products in DB where name, category or description matches query
      // Using regex for case-insensitive partial match
      const regex = new RegExp(q, 'i');
      
      let results = await Product.find({
          $or: [
              { name: regex },
              { category: regex },
              { description: regex }
          ]
      });

      // Score using trends + history
      const scored = results.map(product => {
        let score = 0;
        const p = product.toObject(); // Convert to plain object

        // user history boost
        if (userHistory?.favCategories?.includes(p.category)) score += 0.4;
        if (p.color && userHistory?.favColors?.includes(p.color)) score += 0.3;

        // trending boost
        if (trending.trendingCategories.includes(p.category)) score += 0.3;
        if (p.color && trending.trendingColors.includes(p.color)) score += 0.2;

        return { ...p, score };
      });

      scored.sort((a, b) => b.score - a.score);

      // return only top 5
      return scored.slice(0, 5);
    } catch (error) {
      console.error("Error fetching recommendations from DB:", error);
      return [];
    }
  }
};
