// controllers/salesController.js
const catchAsyncError = require("../middlewares/catchAsyncError");
const salesAgent = require("../services/salesAgent");
const { parseMessage } = require("../utils/nluParser");
const { createSession, updateSession, getSession } = require("../middlewares/sessionStore");
const logger = console;

/**
 * POST /api/v1/sales/parse-search
 * Body: { message }
 * Returns parsed intent + recommended items (if intent is search)
 */
exports.parseAndSearch = catchAsyncError(async (req, res) => {
  const { message, page = 1, limit = 8 } = req.body;
  if (!message) return res.status(400).json({ success: false, message: "message required" });

  const parsed = parseMessage(message);
  const user = req.user;

  // Maintain session for multi-turn
  let sessionId = req.headers["x-session-id"];
  if (!sessionId) {
    sessionId = createSession(user._id, { lastQuery: parsed.query });
  } else {
    updateSession(sessionId, { lastQuery: parsed.query });
  }

  if (parsed.intent === "search") {
    const result = await salesAgent.search(user, { query: parsed.query, page, limit, token: req.headers.authorization?.split(" ")[1] });
    const items = (result.data || []).map(i => ({
      ...i,
      id: i.id || i._id
    }));
    return res.status(200).json({ success: true, intent: "search", query: parsed.query, items: salesAgent.formatForChat(items), sessionId, total: result.total || 0 });
  }

  // other intents like purchase/postpurchase can be handled similarly
  return res.status(200).json({ success: true, intent: parsed.intent, parsed, sessionId });
});

/**
 * POST /api/v1/sales/select
 * Body: { sessionId, selection } // selection: { source, id, rawFake? }
 */
exports.select = catchAsyncError(async (req, res) => {
  const { selection, sessionId } = req.body;
  if (!selection) return res.status(400).json({ success: false, message: "selection required" });

  const user = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  const result = await salesAgent.selectProduct(user, selection, { token });
  if (!result.success) return res.status(400).json(result);

  // store selected product in session context
  if (sessionId) updateSession(sessionId, { selectedProduct: result.product });

  return res.status(200).json({ success: true, product: result.product });
});

/**
 * POST /api/v1/sales/checkout
 * Body: { items, shipping, tax, usePoints, sessionId }
 */
exports.checkout = catchAsyncError(async (req, res) => {
  const { items = [], shipping = 0, tax = 0, usePoints = null, sessionId } = req.body;
  if (!items.length) return res.status(400).json({ success: false, message: "items required" });

  const user = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  // 1. Reserve stock
  const reserveRes = await salesAgent.reserveStock(user, items, { token });
  if (!reserveRes.success) return res.status(400).json({ success: false, message: reserveRes.message || "reserve failed" });

  // 2. Promotions & loyalty
  const cartForPromo = items.map(i => ({ productId: i.productId, price: i.price, quantity: i.qty || 1 }));
  const promoRes = await salesAgent.applyLoyalty(user, cartForPromo, { shipping, tax, maxPointsToUse: usePoints, token });
  if (!promoRes.success) {
    // release reservation if exist
    // try to call inventory release endpoint
    return res.status(400).json({ success: false, message: promoRes.message || "promo error" });
  }

  // 3. Compute amount
  const totalPayable = promoRes.loyalty?.totalPayable ?? promoRes.promotions?.subtotal ?? 0;

  // build order details (to be used by payment metadata)
  const orderDetails = {
    items: promoRes.promotions?.items || cartForPromo,
    subtotal: promoRes.promotions?.subtotal ?? 0,
    shipping, tax, reservationId: reserveRes.reservationId || null
  };

  // 4. Start payment
  const payRes = await salesAgent.startPayment(user, { amount: totalPayable, currency: "inr", orderDetails, idempotencyKey: `user-${user._id}-order-${Date.now()}` }, { token });
  if (!payRes || payRes.error) {
    return res.status(400).json({ success: false, message: payRes?.message || "payment start failed" });
  }

  // save context
  if (sessionId) updateSession(sessionId, { lastOrderDraft: { items, orderDetails, payRes, reservationId: reserveRes.reservationId } });

  return res.status(200).json({
    success: true,
    clientSecret: payRes.clientSecret,
    intentId: payRes.intentId,
    paymentRecordId: payRes.paymentRecordId,
    reservationId: reserveRes.reservationId,
    totalPayable
  });
});

/**
 * POST /api/v1/sales/complete
 * Body: { orderId, reservationId, pointsUsed }
 * Called after payment success (if not using webhook finalization)
 */
exports.complete = catchAsyncError(async (req, res) => {
  const { orderId, reservationId, pointsUsed = 0 } = req.body;
  const user = req.user;
  const token = req.headers.authorization?.split(" ")[1];
  const result = await salesAgent.finalizeAfterPayment({ orderId, reservationId, userId: user._id, pointsUsed }, { token });
  if (!result.success) return res.status(500).json(result);
  return res.status(200).json({ success: true, message: "Order finalized", details: result.details });
});
