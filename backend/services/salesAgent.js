
// // backend/services/salesAgent.js
// const axios = require("axios");
// const logger = console;

// // non-throwing require helper
// function tryRequire(path) {
//   try { return require(path); }
//   catch (e) { return null; }
// }

// // try local modules (prefer services first)
// const recommendationEngine = tryRequire("../services/recommendationEngine");
// const recommendationAgent  = tryRequire("../agents/recommendationAgent");

// const inventoryService     = tryRequire("../services/inventoryService");
// const loyaltyService       = tryRequire("../services/loyaltyAgent");
// const paymentService       = tryRequire("../services/paymentService");
// const fulfillmentService   = tryRequire("../services/fulfillmentService");
// const postPurchaseService  = tryRequire("../services/postPurchaseService");

// // internal base (microservice fallback)
// const INTERNAL_BASE = process.env.INTERNAL_API_BASE || `http://localhost:${process.env.PORT || 8000}/api/v1`;

// // generic HTTP caller to internal endpoints
// async function callInternal(path, method = "post", data = {}, token = null) {
//   const url = `${INTERNAL_BASE}${path}`;
//   const headers = token ? { Authorization: `Bearer ${token}` } : {};
//   const res = await axios({
//     url,
//     method,
//     data,
//     headers,
//     timeout: 10000
//   });
//   return res.data;
// }

// module.exports = {
//   // -----------------------
//   // SEARCH
//   // -----------------------
//   async search(user, { query, page = 1, limit = 10, token = null } = {}) {
//     try {
//       logger.log("🔎 SalesAgent.search():", query);
//       const userId = user?._id || null;

//       // 1) primary: structured recommendation engine (ranking + fakestore fallback)
//       if (recommendationEngine?.searchProducts) {
//         const res = await recommendationEngine.searchProducts(query, userId, { page, limit });
//         return { success: true, data: res.data || [], total: res.total || 0 };
//       }

//       // 2) simpler agent fallback
//       if (recommendationAgent?.getRecommendations) {
//         const userHistory = user?.history || { favCategories: [], favColors: [] };
//         const products = await recommendationAgent.getRecommendations(query, userHistory);
//         return { success: true, data: products || [], total: (products || []).length };
//       }

//       // 3) HTTP fallback to internal recommend route
//       const httpRes = await callInternal("/recommend/search", "post", { query, page, limit }, token);
//       return { success: true, data: httpRes.data || [], total: httpRes.total || 0 };
//     } catch (err) {
//       logger.error("❌ SalesAgent.search error:", err?.message || err);
//       return { success: false, data: [], total: 0, message: err?.message || String(err) };
//     }
//   },

//   // -----------------------
//   // SELECT PRODUCT
//   // -----------------------
//   async selectProduct(user, selection = {}, { token = null } = {}) {
//     try {
//       if (!selection || !selection.source) throw new Error("selection required");

//       // DB product -> fetch product document
//       if (selection.source === "db") {
//         // prefer local recommendationEngine method if it provides findById/getProductById
//         if (recommendationEngine?.getProductById) {
//           const prod = await recommendationEngine.getProductById(selection.id);
//           return { success: true, product: prod };
//         }
//         // fallback to internal products endpoint - CORRECT PATH: /product/:id
//         const res = await callInternal(`/product/${selection.id}`, "get", {}, token);
//         return res;
//       }

//       // FakeStore: import to DB via engine or internal endpoint
//       if (selection.source === "fakestore") {
//         let raw = selection.rawFake;
//         if (!raw && selection.id) {
//           const fid = String(selection.id).replace(/^FAKESTORE_/, "");
//           const r = await axios.get(`https://fakestoreapi.com/products/${fid}`, { timeout: 8000 });
//           raw = r.data;
//         }
//         if (!raw) throw new Error("rawFake required for fakestore import");

//         if (recommendationEngine?.importFakeToDB) {
//           const imported = await recommendationEngine.importFakeToDB(raw);
//           return imported.success ? { success: true, product: imported.product || imported } : imported;
//         }

//         // fallback HTTP endpoint: /recommend/select (controller handles creation)
//         const res = await callInternal("/recommend/select", "post", { fakeProduct: raw }, token);
//         return res;
//       }

//       return { success: false, message: "unknown selection source" };
//     } catch (err) {
//       logger.error("❌ SalesAgent.selectProduct:", err?.message || err);
//       return { success: false, message: err?.message || String(err) };
//     }
//   },

//   // -----------------------
//   // RESERVE STOCK
//   // -----------------------
//   async reserveStock(user, items = [], { token = null } = {}) {
//     try {
//       if (!items || !items.length) return { success: false, message: "items required" };

//       if (inventoryService?.reserveStock) {
//         // local service returns consistent structure
//         return await inventoryService.reserveStock(user._id, items);
//       }

//       // internal HTTP route (inventory controller mounted at /api/v1/)
//       return await callInternal("/inventory/reserve", "post", { userId: user._id, items }, token);
//     } catch (err) {
//       logger.error("❌ SalesAgent.reserveStock:", err?.message || err);
//       return { success: false, message: err?.message || "reserve failed" };
//     }
//   },

//   // -----------------------
//   // APPLY LOYALTY / PROMOTIONS
//   // -----------------------
//   async applyLoyalty(user, cartItems = [], opts = {}) {
//     try {
//       if (!cartItems?.length) return { success: false, message: "cartItems required" };

//       if (loyaltyService?.calculatePromotions) {
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

//       const res = await callInternal("/loyalty/apply", "post", {
//         cartItems,
//         shipping: opts.shipping || 0,
//         tax: opts.tax || 0,
//         maxPointsToUse: opts.maxPointsToUse || null
//       }, opts.token || null);

//       return { success: true, promotions: res.promotions || res, loyalty: res.loyalty || {} };
//     } catch (err) {
//       logger.error("❌ SalesAgent.applyLoyalty:", err?.message || err);
//       return { success: false, message: err?.message || "loyalty error" };
//     }
//   },

//   // -----------------------
//   // START PAYMENT
//   // -----------------------
//   async startPayment(user, { amount, currency = "inr", orderDetails = {}, idempotencyKey = null } = {}, { token = null } = {}) {
//     try {
//       if (!amount || amount <= 0) return { success: false, message: "invalid amount" };

//       if (paymentService?.startPayment) {
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
//       logger.error("❌ SalesAgent.startPayment:", err?.message || err);
//       return { success: false, message: err?.message || "payment error" };
//     }
//   },

//   // -----------------------
//   // FINALIZE AFTER PAYMENT
//   // -----------------------
//   async finalizeAfterPayment({ orderId, reservationId, userId, pointsUsed = 0 } = {}, { token = null } = {}) {
//     const results = {};
//     try {
//       // inventory confirm
//       try {
//         results.inventory = inventoryService?.confirmReservation
//           ? await inventoryService.confirmReservation(reservationId, orderId)
//           : await callInternal("/inventory/confirm", "post", { reservationId, orderId }, token);
//       } catch (err) {
//         results.inventory = { success: false, message: err?.message || "inventory confirm failed" };
//       }

//       // loyalty finalize
//       try {
//         results.loyalty = loyaltyService?.finalizeLoyalty
//           ? await loyaltyService.finalizeLoyalty({ orderId, pointsUsed })
//           : await callInternal("/loyalty/finalize", "post", { orderId, pointsUsed }, token);
//       } catch (err) {
//         results.loyalty = { success: false, message: err?.message || "loyalty finalize failed" };
//       }

//       // schedule fulfillment
//       try {
//         results.fulfillment = fulfillmentService?.scheduleFulfillment
//           ? await fulfillmentService.scheduleFulfillment({ orderId })
//           : await callInternal("/fulfillment/schedule-delivery", "post", { orderId }, token);
//       } catch (err) {
//         results.fulfillment = { success: false, message: err?.message || "fulfillment failed" };
//       }

//       // postpurchase notification/record
//       try {
//         results.postpurchase = postPurchaseService?.createAfterPayment
//           ? await postPurchaseService.createAfterPayment(orderId)
//           : await callInternal("/postpurchase/trigger", "post", { orderId }, token);
//       } catch (err) {
//         results.postpurchase = { success: false, message: err?.message || "postpurchase failed" };
//       }

//       return { success: true, details: results };
//     } catch (err) {
//       logger.error("❌ SalesAgent.finalizeAfterPayment:", err?.message || err);
//       return { success: false, message: err?.message || "finalize error", details: results };
//     }
//   },

//   // helper used by controller
//   formatForChat(items = []) {
//     return (items || []).map(it => ({
//       id: it.id || it._id,
//       title: it.name,
//       price: it.price,
//       desc: it.description ? String(it.description).slice(0, 200) : "",
//       image: (it.images && it.images[0] && (it.images[0].image || it.images[0].url)) || it.image || null,
//       source: it.source || (String(it._id || it.id).startsWith("FAKESTORE_") ? "fakestore" : "db")
//     }));
//   }
// };
// backend/services/salesAgent.js

const axios = require("axios");
const logger = console;

/* ---------------------------------------------------------
   Safe require helper
--------------------------------------------------------- */
function tryRequire(path) {
  try { return require(path); }
  catch (err) { return null; }
}

/* ---------------------------------------------------------
   Optional Local Modules (Used when present)
--------------------------------------------------------- */
const recommendationEngine = tryRequire("../services/recommendationEngine");
const recommendationAgent  = tryRequire("../agents/recommendationAgent");

const inventoryService     = tryRequire("../services/inventoryService");
const loyaltyService       = tryRequire("../services/loyaltyAgent");
const paymentService       = tryRequire("../services/paymentService");
const paymentAgent         = tryRequire("../agents/paymentAgent");
const fulfillmentService   = tryRequire("../services/fulfillmentService");
const postPurchaseService  = tryRequire("../services/postPurchaseService");

/* ---------------------------------------------------------
   Internal Base URL Fallback
--------------------------------------------------------- */
const INTERNAL_BASE =
  process.env.INTERNAL_API_BASE ||
  `http://localhost:${process.env.PORT || 8000}/api/v1`;

/* ---------------------------------------------------------
   Internal HTTP Caller
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   MAIN EXPORT
--------------------------------------------------------- */
module.exports = {

  /* =========================================================
     SEARCH — For Chatbot Search Intent
  ========================================================== */
  async search(user, { query, page = 1, limit = 10, token = null } = {}) {
    try {
      logger.log("🔎 SalesAgent.search():", query);

      const userId = user?._id || null;

      // 1) Local structured engine
      if (recommendationEngine?.searchProducts) {
        const res = await recommendationEngine.searchProducts(query, userId, { page, limit });
        return {
          success: true,
          data: res.data || [],
          total: res.total || 0
        };
      }

      // 2) Fallback: recommendation agent (simple logic)
      if (recommendationAgent?.getRecommendations) {
        const userHistory = user?.history || { favCategories: [], favColors: [] };
        const products = await recommendationAgent.getRecommendations(query, userHistory);
        return {
          success: true,
          data: products || [],
          total: (products || []).length
        };
      }

      // 3) Fallback: internal API
      const httpRes = await callInternal("/recommend/search", "post",
        { query, page, limit },
        token
      );

      return {
        success: true,
        data: httpRes.data || [],
        total: httpRes.total || 0
      };
    } catch (err) {
      logger.error("❌ SalesAgent.search:", err);
      return { success: false, data: [], total: 0, message: err.message };
    }
  },

  /* =========================================================
     SELECT PRODUCT — Chatbot Product Selection Step
  ========================================================== */
  async selectProduct(user, selection = {}, { token = null } = {}) {
    try {
      if (!selection?.source) throw new Error("selection required");

      /* --------------------------
         DB PRODUCT
      ---------------------------*/
      if (selection.source === "db") {
        // Local engine lookup
        if (recommendationEngine?.getProductById) {
          const prod = await recommendationEngine.getProductById(selection.id);
          return { success: true, product: prod };
        }

        // HTTP fallback
        return await callInternal(`/product/${selection.id}`, "get", {}, token);
      }

      /* --------------------------
         FAKESTORE PRODUCT
      ---------------------------*/
      if (selection.source === "fakestore") {
        let raw = selection.rawFake;

        if (!raw && selection.id) {
          const fid = String(selection.id).replace(/^FAKESTORE_/, "");
          const r = await axios.get(
            `https://fakestoreapi.com/products/${fid}`,
            { timeout: 8000 }
          );
          raw = r.data;
        }

        if (!raw) throw new Error("rawFake required for fakestore import");

        // Local import
        if (recommendationEngine?.importFakeToDB) {
          const imported = await recommendationEngine.importFakeToDB(raw);
          return imported.success
            ? { success: true, product: imported.product }
            : imported;
        }

        // HTTP fallback
        return await callInternal("/recommend/select", "post",
          { fakeProduct: raw },
          token
        );
      }

      return { success: false, message: "unknown selection source" };

    } catch (err) {
      logger.error("❌ SalesAgent.selectProduct:", err);
      return { success: false, message: err.message };
    }
  },

  /* =========================================================
     RESERVE STOCK — Called Before Payment
  ========================================================== */
  async reserveStock(user, items = [], { token = null } = {}) {
    try {
      if (!items?.length)
        return { success: false, message: "items required" };

      // Local version
      if (inventoryService?.reserveStock) {
        return await inventoryService.reserveStock(user._id, items);
      }

      // Internal version
      return await callInternal("/inventory/reserve", "post",
        { userId: user._id, items },
        token
      );
    } catch (err) {
      logger.error("❌ SalesAgent.reserveStock:", err);
      return { success: false, message: err.message };
    }
  },

  /* =========================================================
     APPLY LOYALTY — Called Before Payment
  ========================================================== */
  async applyLoyalty(user, cartItems = [], opts = {}) {
    try {
      if (!cartItems?.length)
        return { success: false, message: "cartItems required" };

      // Local service
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

      // Internal fallback
      const res = await callInternal("/loyalty/apply", "post",
        {
          cartItems,
          shipping: opts.shipping || 0,
          tax: opts.tax || 0,
          maxPointsToUse: opts.maxPointsToUse || null
        },
        opts.token
      );

      return {
        success: true,
        promotions: res.promotions || res,
        loyalty: res.loyalty || {}
      };

    } catch (err) {
      logger.error("❌ SalesAgent.applyLoyalty:", err);
      return { success: false, message: err.message };
    }
  },

  /* =========================================================
     START PAYMENT — Razorpay Start
  ========================================================== */
  async startPayment(user, data = {}, { token = null } = {}) {
    try {
      const { amount, currency = "inr", orderDetails = {}, idempotencyKey = null } = data;

      if (!amount || amount <= 0)
        return { success: false, message: "invalid amount" };

      // Try local paymentService first
      if (paymentService?.startPayment) {
        return await paymentService.startPayment({
          userId: String(user._id),
          amount,
          currency,
          orderDetails,
          idempotencyKey
        });
      }

      // Use paymentAgent directly (avoid HTTP call)
      if (paymentAgent?.processPayment) {
        const result = await paymentAgent.processPayment(
          amount,
          currency,
          user,
          orderDetails
        );
        
        // Transform response to expected format
        if (result.success) {
          return {
            success: true,
            clientSecret: result.clientSecret,
            intentId: result.paymentIntentId,
            paymentRecordId: result.paymentIntentId
          };
        }
        return result;
      }

      // Fallback to internal HTTP call (last resort)
      return await callInternal("/start-payment", "post",
        {
          userId: String(user._id),
          amount,
          currency,
          orderDetails,
          idempotencyKey
        },
        token
      );

    } catch (err) {
      logger.error("❌ SalesAgent.startPayment:", err);
      return { success: false, message: err.message };
    }
  },

  /* =========================================================
     FINALIZE AFTER PAYMENT — Full Orchestration
  ========================================================== */
  async finalizeAfterPayment(params = {}, { token = null } = {}) {
    const { paymentId, orderId, userId, cartItems = [], user, pointsUsed = 0, reservationId } = params;

    const results = {};

    try {
      /* ------------------ CREATE ORDER IN DATABASE ------------------ */
      try {
        const Order = require('../models/orderModel');
        
        // Calculate totals
        const itemsPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const taxPrice = itemsPrice * 0.05; // 5% tax
        const shippingPrice = itemsPrice > 500 ? 0 : 40; // Free shipping over ₹500
        const totalPrice = itemsPrice + taxPrice + shippingPrice;

        const newOrder = await Order.create({
          user: userId,
          orderItems: cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            image: item.image,
            price: item.price,
            product: item.product
          })),
          shippingInfo: {
            address: user?.address || "Default Address",
            city: user?.city || "Default City",
            phoneNo: user?.phone || "0000000000",
            postalCode: user?.postalCode || "000000",
            country: user?.country || "India"
          },
          itemsPrice,
          taxPrice,
          shippingPrice,
          totalPrice,
          paymentInfo: {
            id: paymentId || orderId || `PAY-${Date.now()}`,
            status: "paid"
          },
          paidAt: new Date(),
          orderStatus: "Processing"
        });

        results.order = newOrder;
        results.orderId = newOrder._id;
        
      } catch (err) {
        logger.error("❌ Order creation failed:", err);
        return { success: false, message: "Order creation failed: " + err.message };
      }

      /* ------------------ INVENTORY CONFIRM ------------------ */
      try {
        results.inventory = inventoryService?.confirmReservation
          ? await inventoryService.confirmReservation(reservationId, results.orderId)
          : { success: true, message: "Inventory service not available" };
      } catch (err) {
        results.inventory = { success: false, message: err.message };
      }

      /* ------------------ LOYALTY FINALIZE ------------------ */
      try {
        results.loyalty = loyaltyService?.finalizeLoyalty
          ? await loyaltyService.finalizeLoyalty({ orderId: results.orderId, pointsUsed })
          : { success: true, message: "Loyalty service not available" };
      } catch (err) {
        results.loyalty = { success: false, message: err.message };
      }

      /* ------------------ FULFILLMENT SCHEDULE ------------------ */
      try {
        results.fulfillment = fulfillmentService?.scheduleFulfillment
          ? await fulfillmentService.scheduleFulfillment({ orderId: results.orderId })
          : { success: true, message: "Fulfillment service not available" };
      } catch (err) {
        results.fulfillment = { success: false, message: err.message };
      }

      /* ------------------ POST PURCHASE TRIGGER ------------------ */
      try {
        results.postpurchase = postPurchaseService?.createAfterPayment
          ? await postPurchaseService.createAfterPayment(results.orderId)
          : { success: true, message: "Post-purchase service not available" };
      } catch (err) {
        results.postpurchase = { success: false, message: err.message };
      }

      return { 
        success: true, 
        order: results.order,
        orderId: results.orderId,
        details: results 
      };

    } catch (err) {
      logger.error("❌ finalizeAfterPayment:", err);
      return { success: false, details: results, message: err.message };
    }
  },

  /* =========================================================
     Helper: Format products for Chatbot UI
  ========================================================== */
  formatForChat(items = []) {
    return (items || []).map(it => ({
      id: it.id || it._id,
      title: it.name || it.title,
      price: it.price,
      desc: it.description ? String(it.description).slice(0, 200) : "",
      image:
        (it.images?.[0]?.image) ||
        (it.images?.[0]?.url) ||
        it.image ||
        null,
      source: it.source ||
        (String(it._id || it.id).startsWith("FAKESTORE_") ? "fakestore" : "db")
    }));
  }

};
