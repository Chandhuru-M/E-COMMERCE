// telegram/telegramBot.js
// Provide default exports early to avoid circular dependency warnings
module.exports = module.exports || {};
module.exports.bot = null;
module.exports.sendOrderUpdateToUser = async () => false;
module.exports.notifyOrderStatusChanged = async () => false;
module.exports.buildOrderInlineKeyboard = (orderId) => ({});
const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const salesAgent = require("../services/salesAgent");
const RecommendationEngine = require("../services/recommendationEngine");
const path = require("path");

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

// Export a placeholder early to reduce circular dependency warnings
module.exports = module.exports || {};

// Prevent multiple instances of the bot
let bot = null;

// Check if bot is already running (global instance)
if (global.telegramBot) {
  console.log("⚠️ Using existing bot instance (preventing duplicate polling)");
  bot = global.telegramBot;
  module.exports.bot = bot;
} else {
  // Create new bot instance only once
  bot = new TelegramBot(token, { polling: { interval: 300, allowedUpdates: ['message', 'callback_query'] } });
  global.telegramBot = bot;
  module.exports.bot = bot;
  
  // Add error handling for polling
  bot.on('polling_error', (err) => {
    if (err.code === 'ETELEGRAM' && err.message.includes('409')) {
      console.error('❌ [POLLING_ERROR] 409 Conflict - Multiple bot instances detected!');
      console.error('    Make sure to stop any other running instances of this bot');
      console.error('    Error:', err.message);
    } else {
      console.error('❌ [POLLING_ERROR]', err.message);
    }
  });
  
  console.log("✅ BOT LOADED - Polling active");
}

// In-memory state (queue per chat to allow multiple pending flows)
const pendingReplies = new Map();

function pushPending(chatId, ctx) {
  const q = pendingReplies.get(chatId) || [];
  q.push(ctx);
  pendingReplies.set(chatId, q);
}

function getCurrentPending(chatId) {
  const q = pendingReplies.get(chatId);
  return q && q.length ? q[0] : null;
}

function popPending(chatId) {
  const q = pendingReplies.get(chatId);
  if (!q) return;
  q.shift();
  if (q.length) pendingReplies.set(chatId, q);
  else pendingReplies.delete(chatId);
}

// Helper functions
function buildOrderInlineKeyboard(order) {
  const orderId = typeof order === "string" ? order : (order && order._id ? order._id.toString() : null);
  if (!orderId) return { reply_markup: { inline_keyboard: [] } };

  const showPostPurchase = order && (order.deliveryStatus === "DELIVERED" || order.orderStatus === "DELIVERED");
  const keyboard = [[{ text: "🚚 Track", callback_data: `track_${orderId}` }]];

  if (showPostPurchase) {
    keyboard.push([
      { text: "💬 Feedback", callback_data: `feedback_${orderId}` },
      { text: "↩️ Request Return", callback_data: `return_${orderId}` }
    ]);
    keyboard.push([{ text: "⚠️ Report Issue", callback_data: `issue_${orderId}` }]);
  }

  return { reply_markup: { inline_keyboard: keyboard } };
}

function mainMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔍 Search Products", callback_data: "menu_search" }, { text: "🛒 View Cart", callback_data: "menu_cart" }],
        [{ text: "📦 Show My Orders", callback_data: "menu_show_orders" }],
        [{ text: "🚚 Track an Order", callback_data: "menu_track_order" }],
        [{ text: "📷 Scan Barcode", callback_data: "menu_barcode" }, { text: "ℹ️ Help", callback_data: "menu_help" }],
        [{ text: "💌 Compliment", callback_data: "menu_compliment" }, { text: "✉️ Contact Support", callback_data: "menu_support" }]
      ]
    }
  };
}

function buildProductCard(product) {
  let image = product.images && product.images[0] ? product.images[0].image : null;
  
  // Debug log
  console.log(`[IMAGE] Product: ${product.name}, Original path: ${image}`);
  
  // Convert relative path to full URL for Telegram
  // Images are now served from backend
  if (image && !image.startsWith('http')) {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    // Ensure path starts with /
    if (!image.startsWith('/')) {
      image = `/${image}`;
    }
    image = `${backendUrl}${image}`;
    console.log(`[IMAGE] Full URL: ${image}`);
  }
  
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

// Notification functions
async function sendOrderUpdateToUser(userId, title, text, orderIdOrOrder, options = {}) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.telegramChatId) return false;

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

async function notifyOrderStatusChanged(order) {
  let orderDoc = order;
  if (!orderDoc || typeof orderDoc === "string") {
    orderDoc = await Order.findById(order);
  }
  if (!orderDoc) return false;

  const userId = orderDoc.user ? orderDoc.user.toString() : null;
  if (!userId) return false;

  const title = `Order ${orderDoc._id} status update`;
  const text = `Status: ${orderDoc.deliveryStatus || orderDoc.orderStatus}\nTotal: $${orderDoc.totalPrice}\nOrder items: ${orderDoc.orderItems ? orderDoc.orderItems.length : 0}`;
  return sendOrderUpdateToUser(userId, title, text, orderDoc);
}

// Shopping functions
async function handleProductSearch(chatId, query) {
  try {
    const searchTerm = query.trim();
    
    // First try barcode search (alphanumeric)
    let products = await Product.find({ barcode: searchTerm }).limit(5);
    
    // If no barcode match, try text search
    if (products.length === 0) {
      products = await Product.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { category: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      }).limit(5);
    }

    if (products.length === 0) {
      await bot.sendMessage(chatId, `❌ No products found for "${query}". Try:\n• Laptops\n• Phones\n• Shoes`, mainMenuKeyboard());
      return;
    }

    await bot.sendMessage(chatId, `Found ${products.length} product(s) for "${query}" 👇`);
    
    for (const product of products) {
      const card = buildProductCard(product);
      if (card.image) {
        try {
          // Get local file path for the image
          const imagePath = product.images && product.images[0] ? product.images[0].image : null;
          const localImagePath = path.join(__dirname, '..', 'images', imagePath.replace(/^\/images\//, ''));
          
          console.log(`[IMAGE] Trying to send from: ${localImagePath}`);
          
          // Try to send from local file system
          await bot.sendPhoto(chatId, localImagePath, {
            caption: card.text,
            parse_mode: "Markdown",
            ...card.keyboard
          });
        } catch (err) {
          console.error('[IMAGE] Error sending photo:', err.message);
          await bot.sendMessage(chatId, card.text, {
            parse_mode: "Markdown",
            ...card.keyboard
          });
        }
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

async function addToCart(chatId, productId) {
  try {
    let product;
    if (productId.startsWith("FAKESTORE_")) {
      product = await RecommendationEngine.resolveFakeProduct(productId);
    } else {
      product = await Product.findById(productId);
    }

    if (!product) {
      await bot.sendMessage(chatId, "❌ Product not found.");
      return;
    }

    // Get user and use database as single source of truth
    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) {
      await bot.sendMessage(chatId, "⚠️ Please connect your Telegram from the website first.");
      return;
    }

    let cart = user.telegramCart || [];
    const realProductId = product._id.toString();
    const existing = cart.find(item => item.product.toString() === realProductId);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }
    
    user.telegramCart = cart;
    await user.save();
    console.log(`✅ Cart saved to database for user: ${user.name}`);
    
    await bot.sendMessage(chatId, `✅ Added *${product.name}* to cart!\n\nCart: ${user.telegramCart.length} item(s)`, {
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
    await bot.sendMessage(chatId, "Error adding to cart.");
  }
}

async function viewCart(chatId) {
  try {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    
    if (!user) {
      await bot.sendMessage(chatId, "⚠️ Please connect your account first using /start", mainMenuKeyboard());
      return;
    }
    
    // Load cart from database (single source of truth)
    const dbCart = user.telegramCart || [];
    
    // Convert to the format expected by the bot
    const cart = dbCart.map(item => ({
      productId: item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    
    console.log(`[CART] ChatId: ${chatId}, User: ${user.name}, Items: ${cart.length}`);
    
    if (cart.length === 0) {
      await bot.sendMessage(chatId, "🛒 Your cart is empty.", mainMenuKeyboard());
      return;
    }

    let total = 0;
    let cartText = `*🛒 Your Cart*${user ? ` (${user.name})` : ''}\n\n`;
    
    cart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      cartText += `${index + 1}. *${item.name}*\n   ${item.quantity} × $${item.price.toFixed(2)} = $${itemTotal.toFixed(2)}\n\n`;
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
    await bot.sendMessage(chatId, "Error viewing cart.");
  }
}

async function handleCheckout(chatId) {
  try {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    
    if (!user) {
      await bot.sendMessage(chatId, "⚠️ You are not connected to an account. Click Connect Telegram from the website.");
      return;
    }

    const cart = user.telegramCart || [];

    if (cart.length === 0) {
      await bot.sendMessage(chatId, "🛒 Your cart is empty.");
      return;
    }

    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:3000";
    const checkoutUrl = `${frontendUrl}/shipping?source=telegram&userId=${user._id}`;
    
    await bot.sendMessage(chatId, 
      `💳 *Checkout*\n\nTotal: $${total.toFixed(2)}\n\n✅ Your cart has been saved!\n\nClick "Pay Now" to complete your order on the website.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💳 Pay Now", url: checkoutUrl }],
            [{ text: "🏠 Menu", callback_data: "menu_help" }]
          ]
        }
      }
    );
    
  } catch (err) {
    console.error("Checkout error:", err);
    await bot.sendMessage(chatId, "Error during checkout.");
  }
}

// ============================================
// TELEGRAM BOT COMMAND HANDLERS (ONE TIME ONLY!)
// ============================================

// /start command
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const payload = match && match[1] ? match[1].trim() : null;

  console.log(`📱 [START] ChatId: ${chatId}, Payload: ${payload}`);

  if (!payload || payload === "undefined" || payload.length < 6) {
    console.log("⚠️ Invalid or missing payload");
    await bot.sendMessage(chatId, "⚠️ Please click *Connect Telegram* from the website while logged in.", { parse_mode: "Markdown" });
    await bot.sendMessage(chatId, "Main menu:", mainMenuKeyboard());
    return;
  }

  try {
    // Validate if payload is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(payload)) {
      console.log(`❌ Invalid userId format: ${payload}`);
      await bot.sendMessage(chatId, `❌ Invalid user ID format: ${payload}\n\nPlease use the 'Connect Telegram' button from the website.`);
      return;
    }

    const user = await User.findById(payload);
    
    if (!user) {
      console.log(`❌ User not found in database - ID: ${payload}`);
      console.log(`   Searching for any users to verify database connection...`);
      const userCount = await User.countDocuments();
      console.log(`   Total users in database: ${userCount}`);
      
      await bot.sendMessage(chatId, 
        `❌ User not found. The ID doesn't match any account in our system.\n\n` +
        `ID: ${payload}\n\n` +
        `Solutions:\n` +
        `1. Make sure you're logged in on the website\n` +
        `2. Click 'Connect Telegram' from your profile\n` +
        `3. Try again with the new link`, 
        mainMenuKeyboard()
      );
      return;
    }

    // Clear this chatId from any other users first to ensure 1-to-1 mapping
    const clearedCount = await User.updateMany(
      { telegramChatId: String(chatId), _id: { $ne: user._id } },
      { $unset: { telegramChatId: "" } }
    );
    if (clearedCount.modifiedCount > 0) {
      console.log(`🧹 Cleared chatId ${chatId} from ${clearedCount.modifiedCount} other user(s)`);
    }

    // Store chatId as string for consistency
    user.telegramChatId = String(chatId);
    await user.save();
    
    console.log(`✅ [CONNECTED] ChatId: ${chatId} -> User: ${user.name} (${user._id})`);
    
    await bot.sendMessage(chatId, `✅ Connected! Welcome *${user.name}*!`, { parse_mode: "Markdown" });
    await bot.sendMessage(chatId, "Main menu:", mainMenuKeyboard());
    
  } catch (err) {
    console.error("❌ Start command error:", err);
    await bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

// /orders command
bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ telegramChatId: String(chatId) });
  if (!user) return bot.sendMessage(chatId, "⚠️ You are not connected to an account. Click Connect Telegram from the website.");

  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
  if (!orders || orders.length === 0) return bot.sendMessage(chatId, "You have no orders yet.");

  await bot.sendMessage(chatId, "📦 Your recent orders:");
  for (const o of orders) {
    const text = `Order: ${o._id}\nStatus: ${o.deliveryStatus || o.orderStatus}\nTotal: $${o.totalPrice}`;
    await bot.sendMessage(chatId, text, buildOrderInlineKeyboard(o));
  }
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:3000";
  const supportUrl = `${frontendUrl}/support`;

  await bot.sendMessage(
    chatId,
    `I can help you shop and track orders!\n\nFor detailed help, visit: ${supportUrl}\n\nOr use the menu below to continue.`,
    mainMenuKeyboard()
  );
});

// ============================================
// SINGLE CALLBACK QUERY HANDLER
// ============================================
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  try {
    await bot.answerCallbackQuery(query.id);
  } catch (e) {}

  // Menu buttons
  if (data === "menu_search") {
    pushPending(chatId, { type: "search" });
    await bot.sendMessage(chatId, "🔍 *Search Products*\n\nEnter product name or barcode:", { parse_mode: "Markdown" });
    return;
  }

  if (data === "menu_cart") {
    await viewCart(chatId);
    return;
  }

  if (data === "menu_barcode") {
    pushPending(chatId, { type: "search" });
    await bot.sendMessage(chatId, "📷 Enter barcode number:", { parse_mode: "Markdown" });
    return;
  }

  if (data === "menu_compliment") {
    pushPending(chatId, { type: 'compliment' });
    await bot.sendMessage(chatId, "💌 Please write your compliment for our team or product. We appreciate it!", { parse_mode: 'Markdown' });
    return;
  }

  if (data === "menu_support") {
    // Start multi-step support ticket creation: ask for subject first
    pushPending(chatId, { type: 'support_subject' });
    await bot.sendMessage(chatId, "✉️ Please enter a short subject for your support request:", { parse_mode: 'Markdown' });
    return;
  }

  if (data === "menu_show_orders") {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    console.log(`[ORDERS] ChatId: ${chatId}, User: ${user ? `${user.name} (${user._id})` : 'NOT FOUND'}`);
    
    if (!user) {
      console.log(`⚠️ User not found for chatId ${chatId}`);
      console.log(`   Connection status: Check if /start was completed`);
      return bot.sendMessage(chatId, 
        "⚠️ You are not connected to an account.\n\n" +
        "Please:\n" +
        "1. Go to the website\n" +
        "2. Log in to your account\n" +
        "3. Click 'Connect Telegram' button\n" +
        "4. Follow the link to confirm",
        mainMenuKeyboard()
      );
    }

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
    console.log(`[ORDERS] Found ${orders.length} orders for user ${user._id}`);
    
    if (!orders || orders.length === 0) return bot.sendMessage(chatId, "You have no orders yet.");

    await bot.sendMessage(chatId, `Your orders (${user.name}):`);
    for (const o of orders) {
      await bot.sendMessage(chatId, `Order: ${o._id}\nStatus: ${o.orderStatus}\nTotal: $${o.totalPrice}\nUser: ${o.user}`, buildOrderInlineKeyboard(o));
    }
    return;
  }

  if (data === "menu_track_order") {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) return bot.sendMessage(chatId, "⚠️ You are not connected to an account. Click Connect Telegram from the website.");

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
    if (!orders || orders.length === 0) return bot.sendMessage(chatId, "No orders yet.");

    await bot.sendMessage(chatId, "Select order:");
    for (const o of orders) {
      await bot.sendMessage(chatId, `${o._id} — ${o.orderStatus}`, {
        reply_markup: { inline_keyboard: [[{ text: "Track", callback_data: `track_${o._id}` }]] }
      });
    }
    return;
  }

  if (data === "menu_help") {
    const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:3000";
    const supportUrl = `${frontendUrl}/support`;

    // Build keyboard: support button first, then existing main menu rows
    const mainKeyboard = mainMenuKeyboard();
    const combinedKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛠️ Open Support", url: supportUrl }],
          ...mainKeyboard.reply_markup.inline_keyboard
        ]
      }
    };

    await bot.sendMessage(
      chatId,
      `I can help you shop and track orders!\n\nTap 'Open Support' to visit our help page.`,
      combinedKeyboard
    );

    return;
  }

  // Ticket reply action for admins
  if (data.startsWith("ticket_reply_")) {
    const ticketId = data.replace("ticket_reply_", "");
    const admin = await User.findOne({ telegramChatId: String(chatId), role: 'admin' });
    if (!admin) {
      await bot.sendMessage(chatId, "⚠️ You must be an admin (connected) to reply to tickets.");
      return;
    }

    pushPending(chatId, { type: 'admin_ticket_reply', ticketId, adminId: admin._id.toString() });
    await bot.sendMessage(chatId, `✉️ You are replying to ticket ${ticketId}. Please send your message now.`);
    return;
  }

  // Order actions
  if (data.startsWith("track_")) {
    const orderId = data.replace("track_", "");
    const order = await Order.findById(orderId);
    if (!order) return bot.sendMessage(chatId, "Order not found.");

    const text = `📦 *Order Tracking*\n\nID: ${order._id}\nStatus: ${order.orderStatus}\nTotal: $${order.totalPrice}`;
    await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
    return;
  }

  if (data.startsWith("feedback_") || data.startsWith("return_") || data.startsWith("issue_")) {
    const [type, orderId] = data.split("_");
    const user = await User.findOne({ telegramChatId: String(chatId) });
    pushPending(chatId, { type, orderId, userId: user ? user._id.toString() : null });

    if (type === "feedback") {
      await bot.sendMessage(chatId, "⭐ Send your feedback:");
    } else if (type === "return") {
      await bot.sendMessage(chatId, "↩️ Describe return reason:");
    } else {
      await bot.sendMessage(chatId, "⚠️ Describe the issue:");
    }
    return;
  }

  // Shopping actions
  if (data.startsWith("addcart_")) {
    await addToCart(chatId, data.replace("addcart_", ""));
    return;
  }

  if (data.startsWith("details_")) {
    const product = await Product.findById(data.replace("details_", ""));
    if (product) {
      const card = buildProductCard(product);
      const fullText = card.text + `\n\n${product.description}`;
      
      if (card.image) {
        try {
          // Get local file path for the image
          const imagePath = product.images && product.images[0] ? product.images[0].image : null;
          const localImagePath = path.join(__dirname, '..', 'images', imagePath.replace(/^\/images\//, ''));
          
          await bot.sendPhoto(chatId, localImagePath, {
            caption: fullText,
            parse_mode: "Markdown",
            ...card.keyboard
          });
        } catch (err) {
          console.error('[IMAGE] Error sending photo:', err.message);
          await bot.sendMessage(chatId, fullText, {
            parse_mode: "Markdown",
            ...card.keyboard
          });
        }
      } else {
        await bot.sendMessage(chatId, fullText, {
          parse_mode: "Markdown",
          ...card.keyboard
        });
      }
    }
    return;
  }

  if (data === "checkout") {
    await handleCheckout(chatId);
    return;
  }

  if (data === "clear_cart") {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (user) {
      user.telegramCart = [];
      await user.save();
      console.log(`✅ Cleared cart in database for user: ${user.name}`);
    }
    
    await bot.sendMessage(chatId, "🗑️ Cart cleared!", mainMenuKeyboard());
    return;
  }

  await bot.sendMessage(chatId, "Unknown action.", mainMenuKeyboard());
});

// ============================================
// SINGLE MESSAGE HANDLER
// ============================================
bot.on("message", async (msg) => {
  if (!msg || !msg.text || msg.text.startsWith("/")) return;
  
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const state = getCurrentPending(chatId);

  // Handle pending replies (search, feedback, return, issue)
  if (state) {
    if (state.type === "search") {
      await handleProductSearch(chatId, text);
      popPending(chatId);
      return;
    }

    // Customer sending a compliment
    if (state.type === 'compliment') {
      try {
        const Ticket = require('../models/ticketModel');
        const ticketNotifications = require('./ticketNotifications');
        const user = await User.findOne({ telegramChatId: String(chatId) });

        const ticketIdStr = `CMP-${Date.now()}`;
        const ticketData = {
          ticketId: ticketIdStr,
          userId: user ? user._id : undefined,
          type: 'USER_QUERY',
          priority: 'LOW',
          status: 'OPEN',
          subject: 'Compliment via Telegram',
          description: text,
          category: 'other',
          messages: [
            {
              sender: user ? user._id : undefined,
              senderRole: 'User',
              senderName: user ? user.name : 'Telegram User',
              message: text,
              timestamp: new Date()
            }
          ]
        };

        // Store telegram chat id so we can notify the user even if they haven't linked their account
        ticketData.telegramChatId = String(chatId);

        const ticket = await Ticket.create(ticketData);

        // Notify admins about the new compliment ticket
        try {
          await ticketNotifications.sendTicketNotification({
            type: 'TICKET_CREATED',
            ticket,
            userName: user ? user.name : 'Telegram User',
            message: text
          });
        } catch (notifyErr) {
          console.error('Error notifying admins about compliment:', notifyErr.message || notifyErr);
        }

        await bot.sendMessage(chatId, `💌 Thank you! Your compliment has been submitted (ID: ${ticket.ticketId}). Our team appreciates your feedback.`);
      } catch (err) {
        console.error('Compliment handling error:', err);
        await bot.sendMessage(chatId, 'Sorry, there was an error submitting your compliment. Please try again later.');
      } finally {
        popPending(chatId);
      }

      return;
    }

    // Admin replying to a ticket
    if (state.type === 'admin_ticket_reply') {
      try {
        const Ticket = require('../models/ticketModel');
        const ticket = await Ticket.findById(state.ticketId);
        const admin = await User.findOne({ telegramChatId: String(chatId), role: 'admin' });

        if (!admin) {
          await bot.sendMessage(chatId, '⚠️ You are not authorized to reply to tickets.');
          popPending(chatId);
          return;
        }

        if (!ticket) {
          await bot.sendMessage(chatId, 'Ticket not found.');
          popPending(chatId);
          return;
        }

        // Append admin reply to ticket messages (create structure if missing)
        ticket.messages = ticket.messages || [];
        ticket.messages.push({
          from: 'admin',
          admin: admin._id,
          text,
          createdAt: new Date()
        });

        ticket.status = ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status;
        ticket.lastUpdated = new Date();
        await ticket.save();

        // Notify customer via ticketNotifications (this module will send the customer message)
        try {
          const ticketNotifications = require('./ticketNotifications');
          await ticketNotifications.sendTicketNotification({
            type: 'TICKET_REPLIED_ADMIN',
            ticket,
            adminName: admin.name,
            message: text
          });
        } catch (notifyErr) {
          console.error('Error notifying customer via Telegram:', notifyErr.message || notifyErr);
        }

        await bot.sendMessage(chatId, `✅ Reply saved and customer notified for ticket ${ticket.ticketId || ticket._id}`);
      } catch (err) {
        console.error('Admin ticket reply error:', err);
        await bot.sendMessage(chatId, 'Error saving reply.');
      } finally {
        popPending(chatId);
      }

      return;
    }

    // Support ticket subject
    if (state.type === 'support_subject') {
      // Save subject and ask for description
      // pop current subject state, then push the description step
      popPending(chatId);
      pushPending(chatId, { type: 'support_description', subject: text });
      await bot.sendMessage(chatId, 'Please provide detailed description of your issue:', { parse_mode: 'Markdown' });
      return;
    }

    // Support ticket description - final step
    if (state.type === 'support_description') {
      try {
        const Ticket = require('../models/ticketModel');
        const ticketNotifications = require('./ticketNotifications');
        const user = await User.findOne({ telegramChatId: String(chatId) });
        const subject = state.subject || 'Support request via Telegram';

        const count = await Ticket.countDocuments();
        const ticketIdStr = `TKT-${Date.now()}-${count + 1}`;

        const ticketData = {
          ticketId: ticketIdStr,
          userId: user ? user._id : undefined,
          type: 'USER_QUERY',
          priority: 'MEDIUM',
          status: 'OPEN',
          subject,
          description: text,
          category: 'other',
          telegramChatId: String(chatId),
          messages: [
            {
              sender: user ? user._id : undefined,
              senderRole: 'User',
              senderName: user ? user.name : 'Telegram User',
              message: text,
              timestamp: new Date()
            }
          ]
        };

        const ticket = await Ticket.create(ticketData);

        // Notify admins
        try {
          await ticketNotifications.sendTicketNotification({
            type: 'TICKET_CREATED',
            ticket,
            userName: user ? user.name : 'Telegram User',
            message: text
          });
        } catch (notifyErr) {
          console.error('Error notifying admins about support ticket:', notifyErr.message || notifyErr);
        }

        await bot.sendMessage(chatId, `✅ Your support ticket has been created (ID: ${ticket.ticketId}). Our support team will review it.`);
      } catch (err) {
        console.error('Support ticket creation error:', err);
        await bot.sendMessage(chatId, 'Sorry, could not create support ticket. Try again later.');
      } finally {
        popPending(chatId);
      }

      return;
    }

    try {
      const { type, orderId } = state;
      const order = await Order.findById(orderId);
      if (!order) {
        await bot.sendMessage(chatId, "Order not found.");
        popPending(chatId);
        return;
      }

      if (type === "feedback") {
        order.feedback = { comment: text, submittedAt: new Date() };
        await order.save();
        await bot.sendMessage(chatId, "⭐ Feedback recorded!");
      } else if (type === "return") {
        order.returnRequested = true;
        order.returnReason = text;
        order.returnStatus = "Requested";
        await order.save();
        await bot.sendMessage(chatId, "↩️ Return requested!");
      } else if (type === "issue") {
        order.issueDescription = text;
        order.issueStatus = "Open";
        await order.save();
        await bot.sendMessage(chatId, "⚠️ Issue reported!");
      }
    } catch (err) {
      console.error("State handler error:", err);
        await bot.sendMessage(chatId, "Error processing request.");
    } finally {
      popPending(chatId);
    }
    return;
  }

  // Natural language - AI powered!
  const lower = text.toLowerCase();
  
  // Order queries
  if (lower.includes("order") && (lower.includes("where") || lower.includes("track") || lower.includes("my"))) {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) return bot.sendMessage(chatId, "⚠️ You are not connected to an account. Click Connect Telegram from the website.");

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(3);
    if (!orders || orders.length === 0) return bot.sendMessage(chatId, "No orders yet.");

    await bot.sendMessage(chatId, "Your orders:");
    for (const o of orders) {
      await bot.sendMessage(chatId, `${o._id}\nStatus: ${o.orderStatus}`, buildOrderInlineKeyboard(o));
    }
    return;
  }

  // AI-powered shopping
  try {
    await bot.sendChatAction(chatId, "typing");
    
    // Simple keyword-based product search for now
    const products = await Product.find({
      $or: [
        { name: { $regex: text, $options: 'i' } },
        { category: { $regex: text, $options: 'i' } }
      ],
      stock: { $gt: 0 }
    }).limit(3);

    if (products.length > 0) {
      await bot.sendMessage(chatId, `Found ${products.length} products:`);
      for (const product of products) {
        const card = buildProductCard(product);
        
        if (card.image) {
          try {
            const imagePath = product.images && product.images[0] ? product.images[0].image : null;
            const localImagePath = path.join(__dirname, '..', 'images', imagePath.replace(/^\/images\//, ''));
            
            await bot.sendPhoto(chatId, localImagePath, {
              caption: card.text,
              parse_mode: "Markdown",
              ...card.keyboard
            });
          } catch (err) {
            console.error('[IMAGE] Error sending photo:', err.message);
            await bot.sendMessage(chatId, card.text, {
              parse_mode: "Markdown",
              ...card.keyboard
            });
          }
        } else {
          await bot.sendMessage(chatId, card.text, {
            parse_mode: "Markdown",
            ...card.keyboard
          });
        }
      }
      return;
    }

    await bot.sendMessage(chatId, "I can help you shop! Try:\n• 'Show me laptops'\n• 'I want phones'\n• Or use the menu 👇", mainMenuKeyboard());
  } catch (err) {
    console.error("AI handler error:", err);
    await bot.sendMessage(chatId, "Sorry, I had trouble understanding.", mainMenuKeyboard());
  }
});

module.exports = {
  bot,
  sendOrderUpdateToUser,
  notifyOrderStatusChanged,
  buildOrderInlineKeyboard,
  startPolling: () => {
    // Bot already started with polling: true above
    // This function is kept for compatibility with server.js
    console.log("✅ Telegram bot polling already active");
    return true;
  }
};

// ============================================
// GRACEFUL SHUTDOWN HANDLERS
// ============================================

// Handle SIGTERM (process termination)
process.on('SIGTERM', async () => {
  console.log('📋 SIGTERM received - shutting down gracefully...');
  if (bot) {
    try {
      await bot.stopPolling();
      console.log('✅ Bot polling stopped');
    } catch (err) {
      console.error('Error stopping bot:', err.message);
    }
  }
  process.exit(0);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('📋 SIGINT received - shutting down gracefully...');
  if (bot) {
    try {
      await bot.stopPolling();
      console.log('✅ Bot polling stopped');
    } catch (err) {
      console.error('Error stopping bot:', err.message);
    }
  }
  process.exit(0);
});
