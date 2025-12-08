const Product = require("../models/productModel");
const Order = require("../models/orderModel");

module.exports = {
  getRecommendations: async (query, userHistory) => {
    const q = query.toLowerCase();

    // 1️⃣ Fetch all matching products
    let products = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ]
    });

    if (!products.length) return [];

    // 2️⃣ Fetch trending products (ordered most in last 7 days)
    const trendingOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days
        }
      },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const trendingIds = trendingOrders.map(t => String(t._id));

    // 3️⃣ Compute similarity scoring
    const scored = products.map(product => {
      let score = 0;

      // 🎯 A. Keyword match (embedding-like logic)
      const text = (product.name + " " + product.description).toLowerCase();
      if (text.includes(q)) score += 0.3;

      // 🎯 B. User purchase history category score
      if (userHistory?.favCategories?.includes(product.category))
        score += 0.25;

      // 🎯 C. User favorite colors
      if (product.color && userHistory?.favColors?.includes(product.color))
        score += 0.15;

      // 🎯 D. Trending boost
      if (trendingIds.includes(String(product._id)))
        score += 0.25;

      // 🎯 E. Price similarity scoring
      if (userHistory?.avgPrice) {
        const diff = Math.abs(product.price - userHistory.avgPrice);
        if (diff <= 300) score += 0.15;
        else if (diff <= 800) score += 0.1;
      }

      // 🎯 F. Collaborative filtering (users who bought X also bought Y)
      if (userHistory?.relatedProducts?.includes(String(product._id)))
        score += 0.3;

      return { product, score };
    });

    // 4️⃣ Sort by AI score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 10).map(item => item.product);
  }
};
