

// telegram/telegramBot.js
const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const chatAssistantAgent = require("../agents/chatAssistantAgent");
const recommendationAgent = require("../agents/recommendationAgent");
const salesAgent = require("../agents/salesAgent");

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN not provided - Telegram disabled.");
  module.exports = {
    bot: null,
    sendOrderUpdateToUser: async () => false,
    notifyOrderStatusChanged: async () => false,
    buildOrderInlineKeyboard: (orderId) => ({})
  };
  return;
}

const bot = new TelegramBot(token, { polling: true });
console.log("BOT LOADED");


// --- In-memory state management
// Map<chatId, { type: 'feedback'|'return'|'issue'|'search', orderId?: string, userId?: string }>
const pendingReplies = new Map();
// Map<chatId, [{productId, name, price, quantity}]>
const userCarts = new Map();

/* Helper: build inline keyboard for an order (keeps original logic) */
function buildOrderInlineKeyboard(order) {
  // order can be either an id string or an order object
  const orderId = typeof order === "string" ? order : (order && order._id ? order._id.toString() : null);
  if (!orderId) {
    return { reply_markup: { inline_keyboard: [] } };
  }

  // If we have the full order object, determine whether to show post-purchase options
  const showPostPurchase = order && (order.deliveryStatus === "Delivered" || (order.orderStatus && order.orderStatus.includes("Delivered")));

  const keyboard = [
    [
      { text: "🚚 Track", callback_data: `track_${orderId}` }
    ]
  ];

  // Add post-purchase options only when delivered
  if (showPostPurchase) {
    keyboard.push([
      { text: "💬 Feedback", callback_data: `feedback_${orderId}` },
      { text: "↩️ Request Return", callback_data: `return_${orderId}` }
    ]);
    keyboard.push([
      { text: "⚠️ Report Issue", callback_data: `issue_${orderId}` }
    ]);
  }

  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

/* MAIN MENU keyboard (always shown on welcome/help) */
function mainMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "� Search Products", callback_data: "menu_search" }, { text: "🛒 View Cart", callback_data: "menu_cart" }],
        [{ text: "📦 Show My Orders", callback_data: "menu_show_orders" }],
        [{ text: "🚚 Track an Order", callback_data: "menu_track_order" }],
        [{ text: "📷 Scan Barcode", callback_data: "menu_barcode" }, { text: "ℹ️ Help", callback_data: "menu_help" }]
      ]
    }
  };
}

/* Product display with add to cart button */
function buildProductCard(product) {
  const image = product.images && product.images[0] ? product.images[0].image : null;
  const stock = product.stock > 0 ? `✅ In Stock (${product.stock})` : "❌ Out of Stock";
  const price = product.price ? `$${product.price.toFixed(2)}` : "Price not available";
  
  let text = `*${product.name}*\n\n`;
  text += `💰 Price: ${price}\n`;
  text += `📦 ${stock}\n`;
  text += `📁 Category: ${product.category}\n`;
  if (product.ratings) text += `⭐ Rating: ${product.ratings}\n`;
  text += `\n_${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}_`;

  return {
    text,
    image,
    keyboard: {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🛒 Add to Cart", callback_data: `addcart_${product._id}` },
            { text: "📖 Details", callback_data: `details_${product._id}` }
          ]
        ]
      }
    }
  };
}

/* Send welcome message */
async function sendWelcomeAndConnect(chatId, userId) {
  await bot.sendMessage(chatId, `✅ You are connected to order updates (user: ${userId}).\nYou will receive tracking & post-purchase options here.`);
  // show main menu
  await bot.sendMessage(chatId, "Main menu — choose an action:", mainMenuKeyboard());
}

/* Send update to user (keeps your existing API) */
async function sendOrderUpdateToUser(userId, title, text, orderIdOrOrder, options = {}) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.telegramChatId) return false;

    // If we only have orderId, attempt to fetch order to determine buttons (delivered or not)
    let orderObj = null;
    if (typeof orderIdOrOrder === "object" && orderIdOrOrder !== null) {
      orderObj = orderIdOrOrder;
    } else if (typeof orderIdOrOrder === "string") {
      orderObj = await Order.findById(orderIdOrOrder);
    }

    const keyboard = buildOrderInlineKeyboard(orderObj || orderIdOrOrder);
    await bot.sendMessage(user.telegramChatId, `*${title}*\n${text}`, {
      parse_mode: "Markdown",
      disable_web_page_preview: false,
      ...keyboard,
      ...options
    });

    return true;
  } catch (err) {
    console.error("Telegram Send Error:", err?.message || err);
    return false;
  }
}

/* Convenience wrapper used by order controller on status changes */
async function notifyOrderStatusChanged(order) {
  // Accept order document or ID
  let orderDoc = order;
  if (!orderDoc || typeof orderDoc === "string") {
    orderDoc = await Order.findById(order);
  }
  if (!orderDoc) return false;

  const userId = orderDoc.user ? orderDoc.user.toString() : null;
  if (!userId) return false;

  const title = `Order ${orderDoc._id} status update`;
  const text = `Status: ${orderDoc.deliveryStatus || orderDoc.orderStatus}\nTotal: $${orderDoc.totalPrice}\nOrder items: ${orderDoc.orderItems ? orderDoc.orderItems.length : 0}`;
  // send with full order to compute whether feedback/return buttons should be rendered
  return sendOrderUpdateToUser(userId, title, text, orderDoc);
}

// ------------------------
// Telegram handlers
// ------------------------

// /start <userId> - connect website account to this Telegram chat
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const payload = match && match[1] ? match[1].trim() : null;

  console.log("START PAYLOAD RECEIVED:", payload);

  // If no payload or invalid payload: tell user how to connect
  if (!payload || payload === "undefined" || payload.length < 6) {
    await bot.sendMessage(chatId, "⚠️ Invalid connection link. Please click *Connect Telegram* from your website while logged in.", { parse_mode: "Markdown" });
    // still show main menu so user knows what to do (if previously connected)
    await bot.sendMessage(chatId, "Main menu — choose an action:", mainMenuKeyboard());
    return;
  }

  try {
    console.log("Attempting to find user with ID:", payload);
    const user = await User.findById(payload);
    if (!user) {
      console.log("User not found in database with ID:", payload);
      await bot.sendMessage(chatId, `❌ User not found. Please make sure you're logged in and click 'Connect Telegram' from your profile page.\n\nUser ID: ${payload}`);
      return;
    }

    // Save mapping
    console.log("User found:", user.name, user.email);
    user.telegramChatId = chatId;
    await user.save();

    await sendWelcomeAndConnect(chatId, user._id.toString());
    console.log(`✅ Telegram: linked chat ${chatId} -> user ${user._id.toString()} (${user.name})`);
  } catch (err) {
    console.error("❌ Start handler error:", err);
    try {
      await bot.sendMessage(chatId, `❌ Error connecting: ${err.message}\n\nPlease try again or contact support.`);
    } catch (e) {
      console.error("Failed to notify user on start error", e);
    }
  }
});

// Admin helper command
bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  const admin = await User.findOne({ telegramChatId: chatId });
  if (!admin || admin.role !== "admin") {
    return bot.sendMessage(chatId, "❌ You are not authorized as admin.");
  }
  const help = `👑 Admin panel\n/users - list users\n/orders - list recent orders\n/order <id> - view order\n/message <userId> <text> - send message`;
  bot.sendMessage(chatId, help);
});

// List last 5 orders for the user (slash command)
bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ telegramChatId: chatId });
  if (!user) return bot.sendMessage(chatId, "❌ Connect your account via the website first (use Connect Telegram).");

  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
  if (!orders || orders.length === 0) return bot.sendMessage(chatId, "You have no orders yet.");

  let response = "📦 Your recent orders:\n\n";
  orders.forEach(o => {
    const id = o._id.toString();
    const status = o.deliveryStatus || o.orderStatus;
    const eta = o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleString() : "Not available";
    response += `• ID: ${id}\n  Status: ${status}\n  ETA: ${eta}\n\n`;
  });

  await bot.sendMessage(chatId, response);

  for (const o of orders) {
    const text = `📦 Order ID: ${o._id}\nStatus: ${o.deliveryStatus || o.orderStatus}\nETA: ${o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleString() : "Not available"}`;
    await bot.sendMessage(chatId, text, buildOrderInlineKeyboard(o));
  }
});

// Simple help menu displayed if user requests help
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "I can help with order status, tracking links and post-purchase actions. Use the menu below.", mainMenuKeyboard());
});

// help text: natural language queries and keep existing behavior
bot.on("message", async (msg) => {
  // ignore slash commands here — they are handled in onText
  if (!msg || !msg.text) return;
  const text = msg.text.trim().toLowerCase();

  // If message starts with slash, don't handle here (handled by onText)
  if (text.startsWith("/")) return;

  const chatId = msg.chat.id;

  // Handle natural language queries
  if (text.includes("where is my order") || text.includes("track order") || text.includes("where is my order now")) {
    // Ask user to choose which order (present last 5)
    const user = await User.findOne({ telegramChatId: chatId });
    if (!user) return bot.sendMessage(chatId, "⚠️ You are not connected to an account. Click Connect Telegram from the website.");

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
    if (!orders || orders.length === 0) return bot.sendMessage(chatId, "You have no orders yet.");

    await bot.sendMessage(chatId, "Which order would you like to track? Here are your recent orders:");
    for (const o of orders) {
      const textBlock = `📦 Order ID: ${o._id}\nStatus: ${o.deliveryStatus || o.orderStatus}\nETA: ${o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleString() : "Not available"}`;
      await bot.sendMessage(chatId, textBlock, buildOrderInlineKeyboard(o));
    }
    return;
  }

  if (text.includes("what are the orders") || text.includes("orders i placed") || text.includes("my orders")) {
    const user = await User.findOne({ telegramChatId: chatId });
    if (!user) return bot.sendMessage(chatId, "⚠️ You are not connected to an account. Click Connect Telegram from the website.");

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
    if (!orders || orders.length === 0) return bot.sendMessage(chatId, "You have no orders yet.");

    let response = "📦 Your recent orders:\n\n";
    orders.forEach(o => {
      const id = o._id.toString();
      const status = o.deliveryStatus || o.orderStatus;
      const eta = o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleString() : "Not available";
      response += `• ID: ${id}\n  Status: ${status}\n  ETA: ${eta}\n\n`;
    });
    return bot.sendMessage(chatId, response);
  }

  // If user is currently expected to type feedback/return/issue, do nothing here — message handler below will process pendingReplies
  const state = pendingReplies.get(chatId);
  if (state) {
    return;
  }

  // otherwise default friendly message + main menu
  await bot.sendMessage(chatId, "Hi — I can help with your orders. Try the menu below:", mainMenuKeyboard());
});

// Callback query (button) handling — extended to include menu flows + original actions
bot.on("callback_query", async (callbackQuery) => {
  const { data, message } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Acknowledge callback (remove spinner)
    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (e) {}

  // ---------------------------
  // Menu buttons
  // ---------------------------
  if (data === "menu_show_orders") {
    const user = await User.findOne({ telegramChatId: chatId });
    if (!user) return bot.sendMessage(chatId, "⚠️ You are not connected to an account. Click Connect Telegram from the website.");

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
    if (!orders || orders.length === 0) return bot.sendMessage(chatId, "You have no orders yet.");

    await bot.sendMessage(chatId, "Here are your recent orders:");
    for (const o of orders) {
      const text = `📦 Order ID: ${o._id}\nStatus: ${o.deliveryStatus || o.orderStatus}\nETA: ${o.estimatedDelivery ? new Date(o.estimatedDelivery).toLocaleString() : "Not available"}\nTotal: $${o.totalPrice}`;
      await bot.sendMessage(chatId, text, buildOrderInlineKeyboard(o));
    }
    return;
  }

  if (data === "menu_track_order") {
    const user = await User.findOne({ telegramChatId: chatId });
    if (!user) return bot.sendMessage(chatId, "⚠️ You are not connected to an account. Click Connect Telegram from the website.");
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
    if (!orders || orders.length === 0) return bot.sendMessage(chatId, "You have no orders yet.");
    await bot.sendMessage(chatId, "Select an order to track:");
    for (const o of orders) {
      // Show only track button
      await bot.sendMessage(chatId, `📦 ${o._id} — ${o.deliveryStatus || o.orderStatus}`, { reply_markup: { inline_keyboard: [[{ text: "Track Now", callback_data: `track_${o._id}` }]] } });
    }
    return;
  }

  if (data === "menu_help") {
    await bot.sendMessage(chatId, "I can show your orders, let you track them, and collect feedback/returns/issues. Use the menu or type 'Where is my order'.");
    await bot.sendMessage(chatId, "Main menu:", mainMenuKeyboard());
    return;
  }

  // ---------------------------
  // Order-level actions (track / feedback / return / issue)
  // ---------------------------

  if (data.startsWith("track_")) {
    const orderId = data.replace("track_", "");
    const order = await Order.findById(orderId);
    if (!order) return bot.sendMessage(chatId, "Order not found.");

    const status = order.deliveryStatus || order.orderStatus;
    const eta = order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString() : "Not available";
    const trackInfo = order.trackingUrl ? `🔗 ${order.trackingUrl}` : "No tracking link available";

    return bot.sendMessage(chatId, `📦 *Order Tracking*\n\n🆔 Order ID: ${order._id}\n🚚 Status: ${status}\n📅 ETA: ${eta}\n\n${trackInfo}`, { parse_mode: "Markdown", disable_web_page_preview: false });
  }

  if (data.startsWith("feedback_") || data.startsWith("return_") || data.startsWith("issue_")) {
    const [type, orderId] = data.split("_");
    // store pending state for this chat
    const tgUser = await User.findOne({ telegramChatId: chatId });
    pendingReplies.set(chatId, { type, orderId, userId: tgUser ? tgUser._id.toString() : null });

    if (type === "feedback") {
      return bot.sendMessage(chatId, "⭐ Please send your feedback now (you may prefix with rating '5: Great').");
    } else if (type === "return") {
      return bot.sendMessage(chatId, "↩️ Please describe the reason for return now.");
    } else {
      return bot.sendMessage(chatId, "⚠️ Please describe the issue now.");
    }
  }

  // unknown callback: reply with main menu
  await bot.sendMessage(chatId, "Unknown action. Main menu:", mainMenuKeyboard());
});

// Incoming text messages while expecting a reply (feedback / return / issue)
bot.on("message", async (msg) => {
  // ignore commands processed earlier
  if (!msg || !msg.text) return;
  // commands will be handled elsewhere (/start, /orders, etc.)
  if (msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;
  const state = pendingReplies.get(chatId);

  // If not pending, do nothing here (other message handler above deals with natural language)
  if (!state) return;

  try {
    // Handle product search query
    if (state.type === "search") {
      const searchQuery = msg.text;
      await handleProductSearch(chatId, searchQuery);
      pendingReplies.delete(chatId);
      return;
    }

    const { type, orderId } = state;
    const order = await Order.findById(orderId);
    if (!order) {
      await bot.sendMessage(chatId, "Order not found.");
      pendingReplies.delete(chatId);
      return;
    }

    if (type === "feedback") {
      // allow "rating: comment" format
      let rating = null;
      let comment = msg.text;
      const m = msg.text.match(/^(\d)\s*[:\-]\s*(.*)/);
      if (m) {
        rating = parseInt(m[1], 10);
        comment = m[2];
      }
      order.feedback = {
        rating: rating || null,
        comment,
        submittedAt: new Date()
      };
      await order.save();
      await bot.sendMessage(chatId, "⭐ Thank you — your feedback has been recorded.");
    } else if (type === "return") {
      order.returnRequested = true;
      order.returnReason = msg.text;
      order.returnStatus = "Requested";
      await order.save();
      await bot.sendMessage(chatId, "↩️ Return request submitted — our team will review it.");
    } else if (type === "issue") {
      order.issueDescription = msg.text;
      order.issueStatus = "Open";
      await order.save();
      await bot.sendMessage(chatId, "⚠️ Issue reported. Support will contact you soon.");
    }
  } catch (err) {
    console.error("message handler error:", err);
    try {
      await bot.sendMessage(chatId, "Error while processing your response. Please try again.");
    } catch (e) {
      console.error("Failed to notify user after error:", e);
    }
  } finally {
    pendingReplies.delete(chatId);
  }
});

// ========================
// SHOPPING FEATURES
// ========================

/* Search products by text or barcode */
async function handleProductSearch(chatId, query) {
  try {
    const searchTerm = query.trim();
    
    // Check if it's a barcode (numeric, 8+ digits)
    const isBarcode = /^\d{8,}$/.test(searchTerm);
    
    let products;
    if (isBarcode) {
      // Search by barcode
      products = await Product.find({ barcode: searchTerm, stock: { $gt: 0 } }).limit(5);
      if (products.length === 0) {
        // Check online inventory even if store stock is 0
        const allProducts = await Product.find({ barcode: searchTerm });
        if (allProducts.length > 0) {
          await bot.sendMessage(chatId, `❌ Not available in store\n✅ Available online\n\nPrice: $${allProducts[0].price}\n\nWould you like to order it online?`, {
            reply_markup: {
              inline_keyboard: [[{ text: "🛒 Order Online", callback_data: `addcart_${allProducts[0]._id}` }]]
            }
          });
          return;
        }
      }
    } else {
      // Text search
      products = await Product.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { category: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ],
        stock: { $gt: 0 }
      }).limit(5);
    }

    if (products.length === 0) {
      await bot.sendMessage(chatId, `❌ No products found for "${query}". Try searching for:\n• Laptops\n• Phones\n• Shoes\n• Watches`);
      return;
    }

    await bot.sendMessage(chatId, `Found ${products.length} product(s) 👇`);
    
    for (const product of products) {
      const card = buildProductCard(product);
      if (card.image) {
        await bot.sendPhoto(chatId, card.image, {
          caption: card.text,
          parse_mode: "Markdown",
          ...card.keyboard
        });
      } else {
        await bot.sendMessage(chatId, card.text, {
          parse_mode: "Markdown",
          ...card.keyboard
        });
      }
    }
  } catch (err) {
    console.error("Product search error:", err);
    await bot.sendMessage(chatId, "Error searching products. Please try again.");
  }
}

/* Add product to cart */
async function addToCart(chatId, productId) {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      await bot.sendMessage(chatId, "❌ Product not found.");
      return;
    }

    if (product.stock <= 0) {
      await bot.sendMessage(chatId, "❌ Product out of stock.");
      return;
    }

    let cart = userCarts.get(chatId) || [];
    const existing = cart.find(item => item.productId === productId);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        productId,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images && product.images[0] ? product.images[0].image : null
      });
    }
    
    userCarts.set(chatId, cart);
    
    await bot.sendMessage(chatId, `✅ Added *${product.name}* to cart!\n\nCart total: ${cart.length} item(s)`, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🛒 View Cart", callback_data: "menu_cart" },
            { text: "🔍 Continue Shopping", callback_data: "menu_search" }
          ]
        ]
      }
    });
  } catch (err) {
    console.error("Add to cart error:", err);
    await bot.sendMessage(chatId, "Error adding to cart. Please try again.");
  }
}

/* View cart */
async function viewCart(chatId) {
  try {
    const cart = userCarts.get(chatId) || [];
    
    if (cart.length === 0) {
      await bot.sendMessage(chatId, "🛒 Your cart is empty.\n\nStart shopping!", mainMenuKeyboard());
      return;
    }

    let total = 0;
    let cartText = "*🛒 Your Cart*\n\n";
    
    cart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      cartText += `${index + 1}. *${item.name}*\n   Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${itemTotal.toFixed(2)}\n\n`;
    });
    
    cartText += `━━━━━━━━━━━━━━━\n*Total: $${total.toFixed(2)}*`;

    await bot.sendMessage(chatId, cartText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "💳 Checkout", callback_data: "checkout" }],
          [{ text: "🗑️ Clear Cart", callback_data: "clear_cart" }, { text: "🔍 Add More", callback_data: "menu_search" }]
        ]
      }
    });
  } catch (err) {
    console.error("View cart error:", err);
    await bot.sendMessage(chatId, "Error viewing cart. Please try again.");
  }
}

/* Checkout and create Stripe payment */
async function handleCheckout(chatId) {
  try {
    const cart = userCarts.get(chatId) || [];
    const user = await User.findOne({ telegramChatId: chatId });
    
    if (!user) {
      await bot.sendMessage(chatId, "❌ Please connect your account first via the website.");
      return;
    }

    if (cart.length === 0) {
      await bot.sendMessage(chatId, "🛒 Your cart is empty.");
      return;
    }

    // Calculate total
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Save cart to user's session (so website can access it)
    user.telegramCart = cart.map(item => ({
      product: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    await user.save();
    
    // Create Stripe checkout URL (redirect to your website's checkout)
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:3000";
    
    // Direct user to website for secure payment
    const checkoutUrl = `${frontendUrl}/checkout?source=telegram&userId=${user._id}`;
    
    await bot.sendMessage(chatId, 
      `💳 *Checkout*\n\nTotal: $${total.toFixed(2)}\n\nFor secure payment, please complete your order on our website:\n\n👉 ${checkoutUrl}\n\n_Your cart has been saved and will be loaded automatically._`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💳 Pay Now (Secure)", url: checkoutUrl }],
            [{ text: "🏠 Back to Menu", callback_data: "menu_help" }]
          ]
        }
      }
    );
    
  } catch (err) {
    console.error("Checkout error:", err);
    await bot.sendMessage(chatId, "Error during checkout. Please try again.");
  }
}

/* Handle callback queries for shopping */
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  try {
    await bot.answerCallbackQuery(query.id);
  } catch (e) {}

  // Shopping menu callbacks
  if (data === "menu_search") {
    pendingReplies.set(chatId, { type: "search" });
    await bot.sendMessage(chatId, "🔍 *Search Products*\n\nEnter product name, category, or barcode:", { parse_mode: "Markdown" });
    return;
  }

  if (data === "menu_cart") {
    await viewCart(chatId);
    return;
  }

  if (data === "menu_barcode") {
    await bot.sendMessage(chatId, "📷 *Scan Barcode*\n\nPlease enter the barcode number manually:", { parse_mode: "Markdown" });
    pendingReplies.set(chatId, { type: "search" });
    return;
  }

  if (data.startsWith("addcart_")) {
    const productId = data.replace("addcart_", "");
    await addToCart(chatId, productId);
    return;
  }

  if (data.startsWith("details_")) {
    const productId = data.replace("details_", "");
    const product = await Product.findById(productId);
    if (product) {
      const card = buildProductCard(product);
      let fullText = card.text + `\n\n*Full Description:*\n${product.description}`;
      await bot.sendMessage(chatId, fullText, {
        parse_mode: "Markdown",
        ...card.keyboard
      });
    }
    return;
  }

  if (data === "checkout") {
    await handleCheckout(chatId);
    return;
  }

  if (data === "clear_cart") {
    userCarts.delete(chatId);
    await bot.sendMessage(chatId, "🗑️ Cart cleared!", mainMenuKeyboard());
    return;
  }
});

// AI-powered natural language for shopping (DYNAMIC with AI)
bot.on("message", async (msg) => {
  if (!msg || !msg.text || msg.text.startsWith("/")) return;
  
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Check if user has pending state
  const state = pendingReplies.get(chatId);
  if (state) return; // Will be handled by the earlier message handler

  // Check if message is about orders (keep existing functionality)
  const lowerText = text.toLowerCase();
  if (lowerText.includes("order") && (lowerText.includes("where") || lowerText.includes("track") || lowerText.includes("my"))) {
    return; // Let the earlier message handler deal with orders
  }

  try {
    // 🤖 Use AI Sales Agent for intelligent responses
    const user = await User.findOne({ telegramChatId: chatId });
    const session = {
      userId: user ? user._id.toString() : null,
      chatHistory: [] // Can be expanded to store chat history
    };

    await bot.sendChatAction(chatId, "typing"); // Show typing indicator

    const aiResponse = await salesAgent.handleUserMessage(text, session);
    
    if (aiResponse && aiResponse.reply) {
      await bot.sendMessage(chatId, aiResponse.reply, { parse_mode: "Markdown" });
      
      // If AI returned products, show them
      if (aiResponse.products && aiResponse.products.length > 0) {
        await bot.sendMessage(chatId, `Found ${aiResponse.products.length} product(s) 👇`);
        
        for (const product of aiResponse.products.slice(0, 5)) {
          const card = buildProductCard(product);
          if (card.image) {
            await bot.sendPhoto(chatId, card.image, {
              caption: card.text,
              parse_mode: "Markdown",
              ...card.keyboard
            });
          } else {
            await bot.sendMessage(chatId, card.text, {
              parse_mode: "Markdown",
              ...card.keyboard
            });
          }
        }
      }

      // If AI suggests showing menu
      if (aiResponse.showMenu) {
        await bot.sendMessage(chatId, "What would you like to do next?", mainMenuKeyboard());
      }
    } else {
      // Fallback to basic response
      await bot.sendMessage(chatId, "I'm here to help! Try:\n• 'Show me laptops'\n• 'What's trending?'\n• 'I want a phone under 30000'", mainMenuKeyboard());
    }
  } catch (err) {
    console.error("AI message handling error:", err);
    await bot.sendMessage(chatId, "Sorry, I had trouble understanding. Could you rephrase that?", mainMenuKeyboard());
  }
});

// Export functions to be used by controllers
module.exports = {
  bot,
  sendOrderUpdateToUser,
  notifyOrderStatusChanged,
  buildOrderInlineKeyboard
};

