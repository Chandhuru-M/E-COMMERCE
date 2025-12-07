const products = require("../mock/products.json");
const trending = require("../mock/trending.json");

module.exports = {
  getRecommendations: (query, userHistory) => {
    const q = query.toLowerCase();

    // Filter by product name or category
    let results = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );

    // Score using trends + history
    const scored = results.map(product => {
      let score = 0;

      // user history boost
      if (userHistory?.favCategories?.includes(product.category)) score += 0.4;
      if (userHistory?.favColors?.includes(product.color)) score += 0.3;

      // trending boost
      if (trending.trendingCategories.includes(product.category)) score += 0.3;
      if (trending.trendingColors.includes(product.color)) score += 0.2;

      return { ...product, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // return only top 5
    return scored.slice(0, 5);
  }
};
