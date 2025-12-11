
// // -----------------------------
// //  SALES AGENT (FINAL WORKING VERSION)
// // -----------------------------
// // backend/services/salesAgent.js
// // services/salesAgent.js
// const axios = require("axios");
// const logger = console;

// // helper to optionally require without crashing
// function tryRequire(path) {
//   try { return require(path); }
//   catch (e) { return null; }
// }

// // recommendation modules
// const recommendationEngine = tryRequire("../services/recommendationEngine");
// const recommendationAgent = tryRequire("../agents/recommendationAgent");

// // optional loaded services
// const inventoryService = tryRequire("../services/inventoryService");
// const loyaltyService = tryRequire("../services/loyaltyAgent");
// const paymentService = tryRequire("../services/paymentService");
// const fulfillmentService = tryRequire("../services/fulfillmentService");
// const postPurchaseService = tryRequire("../services/postPurchaseService");

// // base internal API
// const INTERNAL_BASE = process.env.INTERNAL_API_BASE || `http://localhost:${process.env.PORT || 8000}/api/v1`;

// // generic internal caller
// async function callInternal(path, method = "post", data = {}, token) {
//   const url = `${INTERNAL_BASE}${path}`;
//   const headers = token ? { Authorization: `Bearer ${token}` } : {};
//   const res = await axios({ url, method, data, headers });
//   return res.data;
// }

// module.exports = {

//   // ================================
//   // SEARCH
//   // ================================
//   async search(user, { query, page = 1, limit = 10, token = null } = {}) {
//     try {
//       logger.log(`🔎 Searching for: ${query}`);

//       if (recommendationEngine?.searchProducts) {
//         const result = await recommendationEngine.searchProducts(query, user?._id, { page, limit });
//         return { success: true, data: result.data || [], total: result.total || 0 };
//       }

//       if (recommendationAgent?.getRecommendations) {
//         const recs = await recommendationAgent.getRecommendations(query);
//         return { success: true, data: recs, total: recs.length };
//       }

//       const resp = await callInternal("/recommend/search", "post", { query, page, limit }, token);
//       return resp;

//     } catch (err) {
//       logger.error("SEARCH ERROR:", err.message);
//       return { success: false, message: err.message };
//     }
//   },

//   // ================================
//   // SELECT PRODUCT
//   // ================================
//   async selectProduct(user, selection, { token = null }) {
//     try {
//       if (selection.source === "db") {
//         return await callInternal(`/products/${selection.id}`, "get", {}, token);
//       }

//       if (selection.source === "fakestore") {
//         const fakeId = String(selection.id).replace("FAKESTORE_", "");
//         const raw = (await axios.get(`https://fakestoreapi.com/products/${fakeId}`)).data;

//         if (recommendationEngine?.importFakeToDB) {
//           const imported = await recommendationEngine.importFakeToDB(raw);
//           return { success: true, product: imported.product };
//         }

//         return await callInternal("/recommend/select", "post", { fakeProduct: raw }, token);
//       }

//       return { success: false, message: "Invalid selection source" };

//     } catch (err) {
//       return { success: false, message: err.message };
//     }
//   },

//   // ================================
//   // RESERVE STOCK  (Corrected!)
//   // ================================
//   async reserveStock(user, items, { token = null }) {
//     try {
//       if (inventoryService?.reserveStock)
//         return await inventoryService.reserveStock(user._id, items);

//       // ❗YOUR ROUTE = /api/v1/reserve
//       return await callInternal("/reserve", "post", { userId: user._id, items }, token);

//     } catch (err) {
//       return { success: false, message: err.message };
//     }
//   },

//   // ================================
//   // LOYALTY / PROMOTIONS
//   // ================================
//   async applyLoyalty(user, cartItems, opts = {}) {
//     try {
//       if (loyaltyService?.calculatePromotions) {
//         const p = await loyaltyService.calculatePromotions(cartItems);
//         return { success: true, promotions: p, loyalty: {} };
//       }

//       // ❗ YOUR ROUTE = /api/v1/apply
//       return await callInternal("/apply", "post", {
//         cartItems,
//         shipping: opts.shipping || 0,
//         tax: opts.tax || 0,
//         maxPointsToUse: opts.maxPointsToUse || null
//       }, opts.token);

//     } catch (err) {
//       return { success: false, message: err.message };
//     }
//   },

//   // ================================
//   // START PAYMENT
//   // ================================
//   async startPayment(user, payload, { token = null }) {
//     try {
//       if (paymentService?.startPayment)
//         return await paymentService.startPayment(payload);

//       return await callInternal("/start-payment", "post",
//         { ...payload, userId: user._id },
//         token
//       );

//     } catch (err) {
//       return { success: false, message: err.message };
//     }
//   },

//   // ================================
//   // FINALIZE ORDER  (Fully Fixed!)
//   // ================================
//   async finalizeAfterPayment({ orderId, reservationId, userId, pointsUsed }, { token = null }) {

//     const result = {};

//     // 1️⃣ INVENTORY CONFIRM — FIXED URL
//     try {
//       result.inventory = await callInternal("/confirm", "post", { orderId, reservationId }, token);
//     } catch (err) {
//       result.inventory = { success: false, message: err.message };
//     }

//     // 2️⃣ LOYALTY FINALIZE — FIXED URL
//     try {
//       result.loyalty = await callInternal("/finalize", "post", { orderId, pointsUsed }, token);
//     } catch (err) {
//       result.loyalty = { success: false, message: err.message };
//     }

//     // 3️⃣ FULFILLMENT — FIXED BASE PATH
//     try {
//       result.fulfillment = await callInternal("/fulfillment/schedule", "post", { orderId }, token);
//     } catch (err) {
//       result.fulfillment = { success: false, message: err.message };
//     }

//     // 4️⃣ POST PURCHASE — FIXED BASE PATH
//     try {
//       result.postpurchase = await callInternal("/postpurchase/create", "post", { orderId }, token);
//     } catch (err) {
//       result.postpurchase = { success: false, message: err.message };
//     }

//     return { success: true, details: result };
//   },

//   // ================================
//   // FORMAT FOR CHAT
//   // ================================
//   formatForChat(items = []) {
//     return items.map(p => ({
//       id: p._id || p.id,
//       title: p.name,
//       price: p.price,
//       desc: p.description,
//       image: p.images?.[0]?.image || p.image,
//       source: p.source || "db"
//     }));
//   }
// };

// backend/services/salesAgent.js
const axios = require("axios");
const logger = console;

// non-throwing require helper
function tryRequire(path) {
  try { return require(path); }
  catch (e) { return null; }
}

// try local modules (prefer services first)
const recommendationEngine = tryRequire("../services/recommendationEngine");
const recommendationAgent  = tryRequire("../agents/recommendationAgent");

const inventoryService     = tryRequire("../services/inventoryService");
const loyaltyService       = tryRequire("../services/loyaltyAgent");
const paymentService       = tryRequire("../services/paymentService");
const fulfillmentService   = tryRequire("../services/fulfillmentService");
const postPurchaseService  = tryRequire("../services/postPurchaseService");

// internal base (microservice fallback)
const INTERNAL_BASE = process.env.INTERNAL_API_BASE || `http://localhost:${process.env.PORT || 8000}/api/v1`;

// generic HTTP caller to internal endpoints
async function callInternal(path, method = "post", data = {}, token = null) {
  const url = `${INTERNAL_BASE}${path}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios({
    url,
    method,
    data,
    headers,
    timeout: 10000
  });
  return res.data;
}

module.exports = {
  // -----------------------
  // SEARCH
  // -----------------------
  async search(user, { query, page = 1, limit = 10, token = null } = {}) {
    try {
      logger.log("🔎 SalesAgent.search():", query);
      const userId = user?._id || null;

      // 1) primary: structured recommendation engine (ranking + fakestore fallback)
      if (recommendationEngine?.searchProducts) {
        const res = await recommendationEngine.searchProducts(query, userId, { page, limit });
        return { success: true, data: res.data || [], total: res.total || 0 };
      }

      // 2) simpler agent fallback
      if (recommendationAgent?.getRecommendations) {
        const userHistory = user?.history || { favCategories: [], favColors: [] };
        const products = await recommendationAgent.getRecommendations(query, userHistory);
        return { success: true, data: products || [], total: (products || []).length };
      }

      // 3) HTTP fallback to internal recommend route
      const httpRes = await callInternal("/recommend/search", "post", { query, page, limit }, token);
      return { success: true, data: httpRes.data || [], total: httpRes.total || 0 };
    } catch (err) {
      logger.error("❌ SalesAgent.search error:", err?.message || err);
      return { success: false, data: [], total: 0, message: err?.message || String(err) };
    }
  },

  // -----------------------
  // SELECT PRODUCT
  // -----------------------
  async selectProduct(user, selection = {}, { token = null } = {}) {
    try {
      if (!selection || !selection.source) throw new Error("selection required");

      // DB product -> fetch product document
      if (selection.source === "db") {
        // prefer local recommendationEngine method if it provides findById/getProductById
        if (recommendationEngine?.getProductById) {
          const prod = await recommendationEngine.getProductById(selection.id);
          return { success: true, product: prod };
        }
        // fallback to internal products endpoint - CORRECT PATH: /product/:id
        const res = await callInternal(`/product/${selection.id}`, "get", {}, token);
        return res;
      }

      // FakeStore: import to DB via engine or internal endpoint
      if (selection.source === "fakestore") {
        let raw = selection.rawFake;
        if (!raw && selection.id) {
          const fid = String(selection.id).replace(/^FAKESTORE_/, "");
          const r = await axios.get(`https://fakestoreapi.com/products/${fid}`, { timeout: 8000 });
          raw = r.data;
        }
        if (!raw) throw new Error("rawFake required for fakestore import");

        if (recommendationEngine?.importFakeToDB) {
          const imported = await recommendationEngine.importFakeToDB(raw);
          return imported.success ? { success: true, product: imported.product || imported } : imported;
        }

        // fallback HTTP endpoint: /recommend/select (controller handles creation)
        const res = await callInternal("/recommend/select", "post", { fakeProduct: raw }, token);
        return res;
      }

      return { success: false, message: "unknown selection source" };
    } catch (err) {
      logger.error("❌ SalesAgent.selectProduct:", err?.message || err);
      return { success: false, message: err?.message || String(err) };
    }
  },

  // -----------------------
  // RESERVE STOCK
  // -----------------------
  async reserveStock(user, items = [], { token = null } = {}) {
    try {
      if (!items || !items.length) return { success: false, message: "items required" };

      if (inventoryService?.reserveStock) {
        // local service returns consistent structure
        return await inventoryService.reserveStock(user._id, items);
      }

      // internal HTTP route (inventory controller mounted at /api/v1/)
      return await callInternal("/inventory/reserve", "post", { userId: user._id, items }, token);
    } catch (err) {
      logger.error("❌ SalesAgent.reserveStock:", err?.message || err);
      return { success: false, message: err?.message || "reserve failed" };
    }
  },

  // -----------------------
  // APPLY LOYALTY / PROMOTIONS
  // -----------------------
  async applyLoyalty(user, cartItems = [], opts = {}) {
    try {
      if (!cartItems?.length) return { success: false, message: "cartItems required" };

      if (loyaltyService?.calculatePromotions) {
        const promotions = await loyaltyService.calculatePromotions(cartItems);
        const loyalty = loyaltyService.computeLoyaltyAndTotals({
          userPoints: user?.loyaltyPoints || 0,
          subtotal: promotions.subtotal,
          shipping: opts.shipping || 0,
          tax: opts.tax || 0,
          maxPointsToUse: opts.maxPointsToUse || null
        });
        return { success: true, promotions, loyalty };
      }

      const res = await callInternal("/loyalty/apply", "post", {
        cartItems,
        shipping: opts.shipping || 0,
        tax: opts.tax || 0,
        maxPointsToUse: opts.maxPointsToUse || null
      }, opts.token || null);

      return { success: true, promotions: res.promotions || res, loyalty: res.loyalty || {} };
    } catch (err) {
      logger.error("❌ SalesAgent.applyLoyalty:", err?.message || err);
      return { success: false, message: err?.message || "loyalty error" };
    }
  },

  // -----------------------
  // START PAYMENT
  // -----------------------
  async startPayment(user, { amount, currency = "inr", orderDetails = {}, idempotencyKey = null } = {}, { token = null } = {}) {
    try {
      if (!amount || amount <= 0) return { success: false, message: "invalid amount" };

      if (paymentService?.startPayment) {
        return await paymentService.startPayment({
          userId: String(user._id),
          amount,
          currency,
          orderDetails,
          idempotencyKey
        });
      }

      return await callInternal("/start-payment", "post", { userId: String(user._id), amount, currency, orderDetails, idempotencyKey }, token);
    } catch (err) {
      logger.error("❌ SalesAgent.startPayment:", err?.message || err);
      return { success: false, message: err?.message || "payment error" };
    }
  },

  // -----------------------
  // FINALIZE AFTER PAYMENT
  // -----------------------
  async finalizeAfterPayment({ orderId, reservationId, userId, pointsUsed = 0 } = {}, { token = null } = {}) {
    const results = {};
    try {
      // inventory confirm
      try {
        results.inventory = inventoryService?.confirmReservation
          ? await inventoryService.confirmReservation(reservationId, orderId)
          : await callInternal("/inventory/confirm", "post", { reservationId, orderId }, token);
      } catch (err) {
        results.inventory = { success: false, message: err?.message || "inventory confirm failed" };
      }

      // loyalty finalize
      try {
        results.loyalty = loyaltyService?.finalizeLoyalty
          ? await loyaltyService.finalizeLoyalty({ orderId, pointsUsed })
          : await callInternal("/loyalty/finalize", "post", { orderId, pointsUsed }, token);
      } catch (err) {
        results.loyalty = { success: false, message: err?.message || "loyalty finalize failed" };
      }

      // schedule fulfillment
      try {
        results.fulfillment = fulfillmentService?.scheduleFulfillment
          ? await fulfillmentService.scheduleFulfillment({ orderId })
          : await callInternal("/fulfillment/schedule-delivery", "post", { orderId }, token);
      } catch (err) {
        results.fulfillment = { success: false, message: err?.message || "fulfillment failed" };
      }

      // postpurchase notification/record
      try {
        results.postpurchase = postPurchaseService?.createAfterPayment
          ? await postPurchaseService.createAfterPayment(orderId)
          : await callInternal("/postpurchase/trigger", "post", { orderId }, token);
      } catch (err) {
        results.postpurchase = { success: false, message: err?.message || "postpurchase failed" };
      }

      return { success: true, details: results };
    } catch (err) {
      logger.error("❌ SalesAgent.finalizeAfterPayment:", err?.message || err);
      return { success: false, message: err?.message || "finalize error", details: results };
    }
  },

  // helper used by controller
  formatForChat(items = []) {
    return (items || []).map(it => ({
      id: it.id || it._id,
      title: it.name,
      price: it.price,
      desc: it.description ? String(it.description).slice(0, 200) : "",
      image: (it.images && it.images[0] && (it.images[0].image || it.images[0].url)) || it.image || null,
      source: it.source || (String(it._id || it.id).startsWith("FAKESTORE_") ? "fakestore" : "db")
    }));
  }
};
