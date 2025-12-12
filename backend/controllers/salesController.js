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
 * Body: { paymentId, orderId }
 * Called after payment success
 */
exports.complete = catchAsyncError(async (req, res) => {
  const { paymentId, orderId } = req.body;
  const user = req.user;
  const token = req.headers.authorization?.split(" ")[1];
  
  // Get cart items from session or request body
  const cartItems = JSON.parse(req.body.cartItems || '[]');
  
  const result = await salesAgent.finalizeAfterPayment({ 
    paymentId,
    orderId, 
    userId: user._id, 
    cartItems,
    user
  }, { token });
  
  if (!result.success) return res.status(500).json(result);
  return res.status(200).json({ 
    success: true, 
    message: "Order created successfully", 
    order: result.order,
    orderId: String(result.orderId || result.order?._id),
    details: result.details 
  });
});

/**
 * POST /api/v1/sales/add-to-cart
 * Body: { productId, quantity }
 */
exports.addToCart = catchAsyncError(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: "productId required" });

  const user = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  // Get or create session cart
  let sessionId = req.headers["x-session-id"];
  let session = sessionId ? getSession(sessionId) : null;

  if (!session) {
    sessionId = createSession(user._id, { cart: [] });
    session = getSession(sessionId);
  }

  // Initialize cart if not exists
  if (!session.cart) {
    session.cart = [];
  }

  // Check if product already in cart
  const existingItem = session.cart.find(item => item.productId.toString() === productId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    session.cart.push({ productId, quantity });
  }

  updateSession(sessionId, { cart: session.cart });

  return res.status(200).json({ 
    success: true, 
    message: "Product added to cart", 
    cartItem: { productId, quantity },
    sessionId 
  });
});

/**
 * GET /api/v1/sales/cart-summary
 */
exports.getCartSummary = catchAsyncError(async (req, res) => {
  const user = req.user;
  const sessionId = req.headers["x-session-id"];
  
  let cart = [];
  
  if (sessionId) {
    const session = getSession(sessionId);
    cart = session?.cart || [];
  }

  // Calculate subtotal (you might want to fetch actual product prices)
  const subtotal = cart.reduce((sum, item) => {
    // You should fetch the actual product price from DB
    // For now, returning a placeholder
    return sum + (item.price || 0) * item.quantity;
  }, 0);

  return res.status(200).json({
    success: true,
    items: cart,
    subtotal,
    itemCount: cart.length
  });
});

/**
 * POST /api/v1/sales/start-payment
 * Body: { amount }
 */
exports.startPayment = catchAsyncError(async (req, res) => {
  const { amount } = req.body;
  if (!amount) return res.status(400).json({ success: false, message: "amount required" });

  const user = req.user;
  const token = req.headers.authorization?.split(" ")[1];

  const orderDetails = {
    userId: user._id,
    amount,
    currency: "inr"
  };

  const payRes = await salesAgent.startPayment(user, { 
    amount, 
    currency: "inr", 
    orderDetails,
    idempotencyKey: `user-${user._id}-payment-${Date.now()}`
  }, { token });

  if (!payRes || payRes.error) {
    return res.status(400).json({ success: false, message: payRes?.message || "payment start failed" });
  }

  return res.status(200).json({
    success: true,
    paymentId: payRes.intentId || payRes.paymentRecordId,
    ...payRes
  });
});
