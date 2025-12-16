const Product = require("../models/productModel");
const axios = require("axios");

module.exports = {
  getRecommendations: async (query, userHistory) => {
    const q = (query || '').toLowerCase().trim();

    // If the query is short/simple, keep existing behavior
    let keywords = [];
    if (!q) {
      keywords = [];
    } else {
      // Split into words, remove common stopwords and short tokens
      const stopwords = new Set(["i","am","the","a","an","to","for","of","in","on","at","is","are","be","you","please","me","can","what","which","and","or","some","my","want","doing","give","do","does","with","by","from"]);
      keywords = q.split(/[^a-z0-9]+/i)
        .map(w => w.trim())
        .filter(w => w && w.length > 2 && !stopwords.has(w));
    }

    // Build a regex that matches any of the keywords (or fallback to full query stem)
    let regex;
    if (keywords.length > 0) {
      // Escape regex metacharacters in keywords
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = keywords.map(esc).join("|");
      regex = new RegExp(`(${pattern})`, "i");
    } else {
      // fallback: simple stem behavior (handles single-word queries)
      const stem = q.replace(/e?s$/, "");
      regex = new RegExp(stem || ".", "i");
    }

    // 🔍 1. Fetch relevant products from DB using keyword-friendly regex
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

