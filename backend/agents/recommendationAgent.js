const Product = require("../models/productModel");
const axios = require("axios");

module.exports = {
  getRecommendations: async (query, userHistory) => {
    const q = query.toLowerCase();

    // 🔍 1. Fetch relevant products from DB
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } }
      ]
    }).lean();

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

    // Get top local products (up to 5)
    let finalProducts = scored.slice(0, 5).map(item => item.product);

    // 3. If less than 5, fetch from Fake Store API
    if (finalProducts.length < 5) {
      try {
        const { data: externalProducts } = await axios.get('https://fakestoreapi.com/products');
        
        // Filter relevant external products
        const relevantExternal = externalProducts.filter(p => 
          p.title.toLowerCase().includes(q) || 
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );

        // Map to local structure
        const mapExternalProduct = (p) => ({
          _id: `ext_${p.id}`,
          name: p.title,
          price: p.price,
          description: p.description,
          images: [{ image: p.image }],
          category: p.category,
          ratings: p.rating?.rate || 0,
          stock: 100, // Assume stock for external items
          source: 'external'
        });

        // Add relevant products first
        for (const p of relevantExternal) {
          if (finalProducts.length < 5) {
            // Avoid duplicates if by chance ID matches or something (unlikely with ext_ prefix)
            finalProducts.push(mapExternalProduct(p));
          }
        }

        // If still less than 5, fill with other external products
        if (finalProducts.length < 5) {
          const otherExternal = externalProducts.filter(p => !relevantExternal.includes(p));
          for (const p of otherExternal) {
            if (finalProducts.length < 5) {
              finalProducts.push(mapExternalProduct(p));
            } else {
              break;
            }
          }
        }

      } catch (error) {
        console.error("Error fetching from Fake Store API:", error.message);
      }
    }

    return finalProducts;
  }
};

