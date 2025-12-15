const Product = require("../models/productModel");
const axios = require("axios");

module.exports = {
  getRecommendations: async (query, userHistory) => {
    const q = query.toLowerCase();
    // Simple singularization for better matching (e.g. "watches" -> "watch")
    const stem = q.replace(/e?s$/, ""); 
    const regex = new RegExp(stem, "i");

    // 🔍 1. Fetch relevant products from DB
    const products = await Product.find({
      $or: [
        { name: { $regex: regex } },
        { category: { $regex: regex } },
        { description: { $regex: regex } }
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

      if (trendingCategories.some(c => regex.test(c)))
        score += 0.2;

      if (trendingColors.includes(product.color?.toLowerCase()))
        score += 0.1;

      return { product, score };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Get top local products (up to 5)
    let finalProducts = scored.slice(0, 5).map(item => item.product);

    // 3. If less than 5, fetch from External APIs
    if (finalProducts.length < 5) {
      try {
        // Try DummyJSON first as it has more variety (especially watches)
        const { data: dummyData } = await axios.get(`https://dummyjson.com/products/search?q=${stem}`);
        
        if (dummyData && dummyData.products) {
           const mapDummyProduct = (p) => ({
            _id: `dummy_${p.id}`,
            name: p.title,
            price: p.price,
            description: p.description,
            images: p.images && p.images.length > 0 ? p.images.map(img => ({ image: img })) : [{ image: p.thumbnail }],
            category: p.category,
            ratings: p.rating || 0,
            stock: p.stock || 50,
            source: 'external'
          });

          for (const p of dummyData.products) {
            if (finalProducts.length < 5) {
               // Check for duplicates by name to be safe
               if (!finalProducts.some(fp => fp.name === p.title)) {
                  finalProducts.push(mapDummyProduct(p));
               }
            } else {
              break;
            }
          }
        }

        // If STILL less than 5, try FakeStoreAPI as backup
        if (finalProducts.length < 5) {
          const { data: externalProducts } = await axios.get('https://fakestoreapi.com/products');
          
          // Filter relevant external products
          const relevantExternal = externalProducts.filter(p => 
            regex.test(p.title) || 
            regex.test(p.category) ||
            regex.test(p.description)
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
               if (!finalProducts.some(fp => fp.name === p.title)) {
                  finalProducts.push(mapExternalProduct(p));
               }
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

