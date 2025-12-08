// const Product = require("../models/productModel");
// const Order = require("../models/orderModel");

// module.exports = {
//   getRecommendations: async (query, userHistory) => {
//     const q = query.toLowerCase();

//     // 1️⃣ Fetch all matching products
//     let products = await Product.find({
//       $or: [
//         { name: { $regex: q, $options: "i" } },
//         { category: { $regex: q, $options: "i" } },
//         { description: { $regex: q, $options: "i" } }
//       ]
//     });

//     if (!products.length) return [];

//     // 2️⃣ Fetch trending products (ordered most in last 7 days)
//     const trendingOrders = await Order.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days
//         }
//       },
//       { $unwind: "$orderItems" },
//       {
//         $group: {
//           _id: "$orderItems.product",
//           count: { $sum: 1 }
//         }
//       },
//       { $sort: { count: -1 } },
//       { $limit: 10 }
//     ]);

//     const trendingIds = trendingOrders.map(t => String(t._id));

//     // 3️⃣ Compute similarity scoring
//     const scored = products.map(product => {
//       let score = 0;

//       // 🎯 A. Keyword match (embedding-like logic)
//       const text = (product.name + " " + product.description).toLowerCase();
//       if (text.includes(q)) score += 0.3;

//       // 🎯 B. User purchase history category score
//       if (userHistory?.favCategories?.includes(product.category))
//         score += 0.25;

//       // 🎯 C. User favorite colors
//       if (product.color && userHistory?.favColors?.includes(product.color))
//         score += 0.15;

//       // 🎯 D. Trending boost
//       if (trendingIds.includes(String(product._id)))
//         score += 0.25;

//       // 🎯 E. Price similarity scoring
//       if (userHistory?.avgPrice) {
//         const diff = Math.abs(product.price - userHistory.avgPrice);
//         if (diff <= 300) score += 0.15;
//         else if (diff <= 800) score += 0.1;
//       }

//       // 🎯 F. Collaborative filtering (users who bought X also bought Y)
//       if (userHistory?.relatedProducts?.includes(String(product._id)))
//         score += 0.3;

//       return { product, score };
//     });

//     // 4️⃣ Sort by AI score
//     scored.sort((a, b) => b.score - a.score);

//     return scored.slice(0, 10).map(item => item.product);
//   }
// };
// services/recommendationService.js
const Product = require("../models/productModel");
const Order = require("../models/orderModel"); // expected in your project
const User = require("../models/userModel");
const fetchWithRetry = require("../utils/fetchWithRetry");
const mapFakeToProductDoc = require("../utils/mapFakeStoreToProduct");
const cache = require("../utils/simpleCache");

// FakeStore endpoints
const FAKESTORE_ALL = "https://fakestoreapi.com/products";
const FAKESTORE_BY_ID = id => `https://fakestoreapi.com/products/${id}`;

// simple helper
const isValidMongoId = id => /^[0-9a-fA-F]{24}$/.test(id);

// --- Trending computation: top sold product IDs in last N days ---
async function getTrendingProductIds(days = 7, limit = 50) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // orders expected to have orderItems: [{ product, qty }]
  const agg = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $unwind: "$orderItems" },
    { $group: { _id: "$orderItems.product", sold: { $sum: "$orderItems.qty" } } },
    { $sort: { sold: -1 } },
    { $limit: limit }
  ]);
  return agg.map(x => String(x._id));
}

// --- Build user profile from orders for simple personalization ---
async function buildUserProfile(userId) {
  if (!isValidMongoId(String(userId))) return null;
  const orders = await Order.find({ user: userId }).populate("orderItems.product");
  const favCategories = {};
  let total = 0, count = 0;
  const purchased = new Set();

  for (const o of orders) {
    for (const it of o.orderItems) {
      const prod = it.product;
      if (!prod) continue;
      purchased.add(String(prod._id));
      if (prod.category) favCategories[prod.category] = (favCategories[prod.category] || 0) + (it.qty || 1);
      total += (prod.price || 0) * (it.qty || 1);
      count += (it.qty || 1);
    }
  }

  const favCategoriesSorted = Object.entries(favCategories).sort((a,b) => b[1]-a[1]).map(x=>x[0]);
  return {
    favCategories: favCategoriesSorted,
    avgPrice: count ? total / count : null,
    purchased: Array.from(purchased)
  };
}

// --- Scoring function ---
function scoreProduct(prod, queryLower, userProfile, trendingIds) {
  let score = 0;
  const name = (prod.name || "").toString().toLowerCase();
  const desc = (prod.description || "").toString().toLowerCase();
  const cat = (prod.category || "").toString().toLowerCase();

  if (name.includes(queryLower)) score += 0.5;
  if (desc.includes(queryLower)) score += 0.2;
  if (cat.includes(queryLower)) score += 0.2;

  if (userProfile?.favCategories?.includes(prod.category)) score += 0.3;
  if (userProfile?.purchased?.includes(String(prod._id))) score += 0.25;
  if (trendingIds && trendingIds.includes(String(prod._id))) score += 0.35;

  if (userProfile?.avgPrice && prod.price) {
    const diff = Math.abs(prod.price - userProfile.avgPrice);
    if (diff <= (userProfile.avgPrice * 0.2)) score += 0.15;
  }

  return score;
}

// --- Search function ---------------------------------------------------
async function searchProducts(query, userId, { page = 1, limit = 12 } = {}) {
  const q = (query || "").trim();
  if (!q) return { success: false, data: [], total: 0 };

  const cacheKey = `rec:search:${userId || "anon"}:${q}:${page}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const queryRegex = { $regex: q, $options: "i" };
  const dbFilter = {
    $or: [
      { name: queryRegex },
      { category: queryRegex },
      { description: queryRegex }
    ]
  };

  // parallelize profile & trending
  const [userProfile, trendingIds] = await Promise.all([
    userId ? buildUserProfile(userId) : Promise.resolve(null),
    getTrendingProductIds(7, 50)
  ]);

  // get DB candidates (a bit larger set)
  const dbCandidates = await Product.find(dbFilter).limit(limit * 3).lean();

  const candidates = dbCandidates.map(p => ({ source: "db", product: p }));

  // if not enough candidates, call FakeStore (with retry)
  if (candidates.length < 6) {
    try {
      const fakeList = await fetchWithRetry(FAKESTORE_ALL, { retries: 2, timeout: 3000 });
      const qLower = q.toLowerCase();
      // Filter locally for match
      for (const f of fakeList) {
        if (
          (f.title && f.title.toLowerCase().includes(qLower)) ||
          (f.description && f.description.toLowerCase().includes(qLower)) ||
          (f.category && f.category.toLowerCase().includes(qLower))
        ) {
          candidates.push({
            source: "fakestore",
            product: {
              _id: `FAKESTORE_${f.id}`,
              name: f.title,
              description: f.description,
              price: f.price,
              category: f.category,
              image: f.image,
              _rawFake: f
            }
          });
        }
      }
    } catch (err) {
      // external API failed: continue with DB candidates
      console.warn("FakeStore fetch failed:", err.message || err);
    }
  }

  // Score
  const qLower = q.toLowerCase();
  const scored = candidates.map(c => {
    const s = scoreProduct(c.product, qLower, userProfile, trendingIds);
    return { source: c.source, product: c.product, score: s };
  });

  // sort & paginate
  scored.sort((a,b) => b.score - a.score);
  const total = scored.length;
  const start = (page - 1) * limit;
  const pageItems = scored.slice(start, start + limit);

  const data = pageItems.map(x => {
    const p = x.product;
    return {
      source: x.source,
      id: p._id,
      name: p.name,
      price: p.price,
      description: p.description,
      category: p.category,
      image: (p.images && p.images[0] && p.images[0].image) || p.image || null,
      score: x.score,
      rawFake: x.source === "fakestore" ? p._rawFake : undefined
    };
  });

  const result = { success: true, data, total };
  cache.set(cacheKey, result, 30_000); // cache 30s locally
  return result;
}

// --- importFakeToDB: called by Sales Agent after user OK ---
async function importFakeToDB(fakePayload) {
  if (!fakePayload || !fakePayload.title) return { success: false, message: "invalid payload" };

  const mapped = mapFakeToProductDoc(fakePayload);

  // Ensure required fields exist
  if (!mapped.name) mapped.name = fakePayload.title || "Untitled";
  if (typeof mapped.price !== "number") mapped.price = Number(fakePayload.price || 0);
  if (!mapped.seller) mapped.seller = "FakeStore";
  if (!mapped.stock) mapped.stock = 20;

  // Create product
  const created = await Product.create(mapped);
  // clear relevant caches
  cache.del("rec:trending");
  return { success: true, product: created };
}

module.exports = {
  searchProducts,
  importFakeToDB,
  getTrendingProductIds
};
