// // services/salesAgent.js
// const axios = require("axios");
// const logger = console;
// const recommendService = tryRequire("../services/recommendationService");
// const inventoryService = tryRequire("../services/inventoryService");
// const loyaltyService = tryRequire("../services/loyaltyAgent");
// const paymentService = tryRequire("../services/paymentService"); // or paymentAgent
// const fulfillmentService = tryRequire("../services/fulfillmentService");
// const postPurchaseService = tryRequire("../services/postPurchaseService");

// // Helper to optionally require local module
// function tryRequire(path) {
//   try { return require(path); }
//   catch (e) { return null; }
// }

// // Internal fallback base for HTTP calls to your own app
// const INTERNAL_BASE = process.env.INTERNAL_API_BASE || `http://localhost:${process.env.PORT || 8000}/api/v1`;

// async function callInternal(path, method = "post", data = {}, token) {
//   const url = `${INTERNAL_BASE}${path}`;
//   const headers = token ? { Authorization: `Bearer ${token}` } : {};
//   const res = await axios({ url, method, data, headers, timeout: 8000 });
//   return res.data;
// }

// module.exports = {
//   // SEARCH: calls recommendation agent (local service or internal HTTP)
//   async search(user, { query, page = 1, limit = 8, token = null }) {
//     try {
//       if (recommendService && recommendService.searchProducts) {
//         return await recommendService.searchProducts(query, user?._id, { page, limit });
//       }
//       return await callInternal("/recommend/search", "post", { query, page, limit }, token);
//     } catch (err) {
//       logger.error("SalesAgent.search error:", err.message || err);
//       return { success: false, data: [], total: 0, message: err.message };
//     }
//   },

//   // SELECT: when user confirms a product (fakestore -> save to DB or return DB product)
//   async selectProduct(user, selection, { token = null } = {}) {
//     // selection: { source, id, rawFake? }
//     try {
//       if (!selection) throw new Error("selection required");
//       if (selection.source === "db") {
//         if (recommendService && recommendService.getProductById) {
//           const prod = await recommendService.getProductById(selection.id);
//           return { success: true, product: prod };
//         }
//         // fallback to /products/:id
//         const res = await callInternal(`/products/${selection.id}`, "get", {}, token);
//         return res;
//       }

//       if (selection.source === "fakestore") {
//         // import to DB
//         const fake = selection.rawFake;
//         if (!fake) {
//           // fetch raw from fakestore if only id provided
//           const fid = (selection.id || "").replace("FAKESTORE_", "");
//           const r = await axios.get(`https://fakestoreapi.com/products/${fid}`);
//           selection.rawFake = r.data;
//         }
//         if (recommendService && recommendService.importFakeToDB) {
//           const result = await recommendService.importFakeToDB(selection.rawFake);
//           return result;
//         }
//         // fallback HTTP
//         return await callInternal("/recommend/select", "post", { fakeProduct: selection.rawFake }, token);
//       }

//       return { success: false, message: "unknown selection source" };
//     } catch (err) {
//       logger.error("SalesAgent.selectProduct:", err.message || err);
//       return { success: false, message: err.message || "select error" };
//     }
//   },

//   // RESERVE: ask inventory to reserve product(s)
//   async reserveStock(user, items, { token = null } = {}) {
//     try {
//       if (inventoryService && inventoryService.reserveStock) {
//         return await inventoryService.reserveStock(user._id, items);
//       }
//       return await callInternal("/inventory/reserve", "post", { userId: user._id, items }, token);
//     } catch (err) {
//       logger.error("SalesAgent.reserveStock:", err.message || err);
//       return { success: false, message: err.message || "reserve failed" };
//     }
//   },

//   // APPLY LOYALTY/OFFERS
//   async applyLoyalty(user, cartItems, opts = {}) {
//     try {
//       if (loyaltyService && loyaltyService.calculatePromotions) {
//         const promotions = await loyaltyService.calculatePromotions(cartItems);
//         const loyalty = loyaltyService.computeLoyaltyAndTotals({
//           userPoints: user?.loyaltyPoints || 0,
//           subtotal: promotions.subtotal,
//           shipping: opts.shipping || 0,
//           tax: opts.tax || 0,
//           maxPointsToUse: opts.maxPointsToUse || null
//         });
//         return { success: true, promotions, loyalty };
//       }
//       return await callInternal("/loyalty/apply", "post", { cartItems, shipping: opts.shipping || 0, tax: opts.tax || 0, maxPointsToUse: opts.maxPointsToUse || null }, opts.token);
//     } catch (err) {
//       logger.error("SalesAgent.applyLoyalty:", err.message || err);
//       return { success: false, message: err.message || "loyalty error" };
//     }
//   },

//   // START PAYMENT (returns clientSecret)
//   async startPayment(user, { amount, currency = "inr", orderDetails = {}, idempotencyKey = null }, { token = null } = {}) {
//     try {
//       if (paymentService && paymentService.startPayment) {
//         return await paymentService.startPayment({
//           userId: String(user._id),
//           amount,
//           currency,
//           orderDetails,
//           idempotencyKey
//         });
//       }
//       return await callInternal("/start-payment", "post", { userId: String(user._id), amount, currency, orderDetails, idempotencyKey }, token);
//     } catch (err) {
//       logger.error("SalesAgent.startPayment:", err.message || err);
//       return { success: false, message: err.message || "payment error" };
//     }
//   },

//   // FINALIZE after payment succeeded: confirm reservation, finalize loyalty, schedule fulfillment, notify
//   async finalizeAfterPayment({ orderId, reservationId, userId, pointsUsed = 0 }, { token = null } = {}) {
//     const results = {};
//     try {
//       // confirm reservation
//       try {
//         if (inventoryService && inventoryService.confirmReservation) {
//           results.inventory = await inventoryService.confirmReservation(reservationId, orderId);
//         } else {
//           results.inventory = await callInternal("/inventory/confirm", "post", { reservationId, orderId }, token);
//         }
//       } catch (err) {
//         results.inventory = { success: false, message: err.message || "inventory confirm failed" };
//       }

//       // finalize loyalty
//       try {
//         if (loyaltyService && loyaltyService.finalizeLoyalty) {
//           results.loyalty = await loyaltyService.finalizeLoyalty({ orderId, pointsUsed });
//         } else {
//           results.loyalty = await callInternal("/loyalty/finalize", "post", { orderId, pointsUsed }, token);
//         }
//       } catch (err) {
//         results.loyalty = { success: false, message: err.message || "loyalty finalize failed" };
//       }

//       // schedule fulfillment
//       try {
//         if (fulfillmentService && fulfillmentService.scheduleFulfillment) {
//           results.fulfillment = await fulfillmentService.scheduleFulfillment({ orderId });
//         } else {
//           results.fulfillment = await callInternal("/fulfillment/schedule", "post", { orderId }, token);
//         }
//       } catch (err) {
//         results.fulfillment = { success: false, message: err.message || "fulfillment failed" };
//       }

//       // postpurchase notification
//       try {
//         if (postPurchaseService && postPurchaseService.createAfterPayment) {
//           results.postpurchase = await postPurchaseService.createAfterPayment(orderId);
//         } else {
//           results.postpurchase = await callInternal("/postpurchase/create", "post", { orderId }, token);
//         }
//       } catch (err) {
//         results.postpurchase = { success: false, message: err.message || "postpurchase error" };
//       }

//       return { success: true, details: results };
//     } catch (err) {
//       logger.error("SalesAgent.finalizeAfterPayment:", err.message || err);
//       return { success: false, message: err.message || "finalize error", details: results };
//     }
//   },

//   // small helper to format items for chat UI
//   formatForChat(items = []) {
//     return items.map(it => ({
//       id: it.id || it._id,
//       title: it.name,
//       price: it.price,
//       desc: it.description && it.description.slice(0, 200),
//       image: (it.images && it.images[0] && it.images[0].image) || it.image || null,
//       source: it.source || "db"
//     }));
//   }
// };
// services/salesAgent.js
// backend/services/salesAgent.js
// -----------------------------
//  SALES AGENT (FINAL WORKING VERSION)
// -----------------------------
// backend/services/salesAgent.js
// services/salesAgent.js
const axios = require("axios");
const logger = console;

// helper to optionally require without crashing
function tryRequire(path) {
  try { return require(path); }
  catch (e) { return null; }
}

// recommendation modules
const recommendationEngine = tryRequire("../services/recommendationEngine");
const recommendationAgent = tryRequire("../agents/recommendationAgent");

// optional loaded services
const inventoryService = tryRequire("../services/inventoryService");
const loyaltyService = tryRequire("../services/loyaltyAgent");
const paymentService = tryRequire("../services/paymentService");
const fulfillmentService = tryRequire("../services/fulfillmentService");
const postPurchaseService = tryRequire("../services/postPurchaseService");

// base internal API
const INTERNAL_BASE = process.env.INTERNAL_API_BASE || `http://localhost:${process.env.PORT || 8000}/api/v1`;

// generic internal caller
async function callInternal(path, method = "post", data = {}, token) {
  const url = `${INTERNAL_BASE}${path}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios({ url, method, data, headers });
  return res.data;
}

module.exports = {

  // ================================
  // SEARCH
  // ================================
  async search(user, { query, page = 1, limit = 10, token = null } = {}) {
    try {
      logger.log(`🔎 Searching for: ${query}`);

      if (recommendationEngine?.searchProducts) {
        const result = await recommendationEngine.searchProducts(query, user?._id, { page, limit });
        return { success: true, data: result.data || [], total: result.total || 0 };
      }

      if (recommendationAgent?.getRecommendations) {
        const recs = await recommendationAgent.getRecommendations(query);
        return { success: true, data: recs, total: recs.length };
      }

      const resp = await callInternal("/recommend/search", "post", { query, page, limit }, token);
      return resp;

    } catch (err) {
      logger.error("SEARCH ERROR:", err.message);
      return { success: false, message: err.message };
    }
  },

  // ================================
  // SELECT PRODUCT
  // ================================
  async selectProduct(user, selection, { token = null }) {
    try {
      if (selection.source === "db") {
        return await callInternal(`/products/${selection.id}`, "get", {}, token);
      }

      if (selection.source === "fakestore") {
        const fakeId = String(selection.id).replace("FAKESTORE_", "");
        const raw = (await axios.get(`https://fakestoreapi.com/products/${fakeId}`)).data;

        if (recommendationEngine?.importFakeToDB) {
          const imported = await recommendationEngine.importFakeToDB(raw);
          return { success: true, product: imported.product };
        }

        return await callInternal("/recommend/select", "post", { fakeProduct: raw }, token);
      }

      return { success: false, message: "Invalid selection source" };

    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ================================
  // RESERVE STOCK  (Corrected!)
  // ================================
  async reserveStock(user, items, { token = null }) {
    try {
      if (inventoryService?.reserveStock)
        return await inventoryService.reserveStock(user._id, items);

      // ❗YOUR ROUTE = /api/v1/reserve
      return await callInternal("/reserve", "post", { userId: user._id, items }, token);

    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ================================
  // LOYALTY / PROMOTIONS
  // ================================
  async applyLoyalty(user, cartItems, opts = {}) {
    try {
      if (loyaltyService?.calculatePromotions) {
        const p = await loyaltyService.calculatePromotions(cartItems);
        return { success: true, promotions: p, loyalty: {} };
      }

      // ❗ YOUR ROUTE = /api/v1/apply
      return await callInternal("/apply", "post", {
        cartItems,
        shipping: opts.shipping || 0,
        tax: opts.tax || 0,
        maxPointsToUse: opts.maxPointsToUse || null
      }, opts.token);

    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ================================
  // START PAYMENT
  // ================================
  async startPayment(user, payload, { token = null }) {
    try {
      if (paymentService?.startPayment)
        return await paymentService.startPayment(payload);

      return await callInternal("/start-payment", "post",
        { ...payload, userId: user._id },
        token
      );

    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ================================
  // FINALIZE ORDER  (Fully Fixed!)
  // ================================
  async finalizeAfterPayment({ orderId, reservationId, userId, pointsUsed }, { token = null }) {

    const result = {};

    // 1️⃣ INVENTORY CONFIRM — FIXED URL
    try {
      result.inventory = await callInternal("/confirm", "post", { orderId, reservationId }, token);
    } catch (err) {
      result.inventory = { success: false, message: err.message };
    }

    // 2️⃣ LOYALTY FINALIZE — FIXED URL
    try {
      result.loyalty = await callInternal("/finalize", "post", { orderId, pointsUsed }, token);
    } catch (err) {
      result.loyalty = { success: false, message: err.message };
    }

    // 3️⃣ FULFILLMENT — FIXED BASE PATH
    try {
      result.fulfillment = await callInternal("/fulfillment/schedule", "post", { orderId }, token);
    } catch (err) {
      result.fulfillment = { success: false, message: err.message };
    }

    // 4️⃣ POST PURCHASE — FIXED BASE PATH
    try {
      result.postpurchase = await callInternal("/postpurchase/create", "post", { orderId }, token);
    } catch (err) {
      result.postpurchase = { success: false, message: err.message };
    }

    return { success: true, details: result };
  },

  // ================================
  // FORMAT FOR CHAT
  // ================================
  formatForChat(items = []) {
    return items.map(p => ({
      id: p._id || p.id,
      title: p.name,
      price: p.price,
      desc: p.description,
      image: p.images?.[0]?.image || p.image,
      source: p.source || "db"
    }));
  }
};
