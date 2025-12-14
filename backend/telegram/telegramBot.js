// telegram/telegramBot.js
const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const salesAgent = require("../services/salesAgent");
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

const bot = new TelegramBot(token, { polling: true });
console.log("BOT LOADED");

// In-memory state
const pendingReplies = new Map();

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
        [{ text: "📷 Scan Barcode", callback_data: "menu_barcode" }, { text: "ℹ️ Help", callback_data: "menu_help" }]
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
    const isBarcode = /^\d{8,}$/.test(searchTerm);
    
    let products;
    if (isBarcode) {
      products = await Product.find({ barcode: searchTerm, stock: { $gt: 0 } }).limit(5);
      if (products.length === 0) {
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
    const product = await Product.findById(productId);
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
    const existing = cart.find(item => item.product.toString() === productId);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        product: productId,
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

  console.log("START PAYLOAD:", payload);

  if (!payload || payload === "undefined" || payload.length < 6) {
    await bot.sendMessage(chatId, "⚠️ Please click *Connect Telegram* from the website while logged in.", { parse_mode: "Markdown" });
    await bot.sendMessage(chatId, "Main menu:", mainMenuKeyboard());
    return;
  }

  try {
    const user = await User.findById(payload);
    if (!user) {
      console.log("User not found:", payload);
      await bot.sendMessage(chatId, `❌ User not found. Please log in and click 'Connect Telegram'.\n\nID: ${payload}`);
      return;
    }

    // Clear this chatId from any other users first to ensure only one user has it
    await User.updateMany(
      { telegramChatId: String(chatId), _id: { $ne: user._id } },
      { $unset: { telegramChatId: "" } }
    );
    console.log(`🧹 Cleared chatId ${chatId} from other users`);

    // Store as string to ensure consistency
    user.telegramChatId = String(chatId);
    await user.save();
    console.log(`✅ Saved telegramChatId: ${user.telegramChatId} for user: ${user.name}`);

    await bot.sendMessage(chatId, `✅ Connected! Welcome ${user.name}!`);
    await bot.sendMessage(chatId, "Main menu:", mainMenuKeyboard());
    console.log(`✅ Linked: ${chatId} -> ${user._id} (${user.name})`);
  } catch (err) {
    console.error("Start error:", err);
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
  await bot.sendMessage(msg.chat.id, "I can help you shop and track orders!", mainMenuKeyboard());
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
    pendingReplies.set(chatId, { type: "search" });
    await bot.sendMessage(chatId, "🔍 *Search Products*\n\nEnter product name or barcode:", { parse_mode: "Markdown" });
    return;
  }

  if (data === "menu_cart") {
    await viewCart(chatId);
    return;
  }

  if (data === "menu_barcode") {
    pendingReplies.set(chatId, { type: "search" });
    await bot.sendMessage(chatId, "📷 Enter barcode number:", { parse_mode: "Markdown" });
    return;
  }

  if (data === "menu_show_orders") {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    console.log(`[ORDERS] ChatId: ${chatId}, User: ${user ? `${user.name} (${user._id})` : 'NONE'}`);
    if (!user) return bot.sendMessage(chatId, "⚠️ You are not connected to an account. Click Connect Telegram from the website.");

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
    await bot.sendMessage(chatId, "I help you shop and track orders!", mainMenuKeyboard());
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
    pendingReplies.set(chatId, { type, orderId, userId: user ? user._id.toString() : null });

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
  const state = pendingReplies.get(chatId);

  // Handle pending replies (search, feedback, return, issue)
  if (state) {
    if (state.type === "search") {
      await handleProductSearch(chatId, text);
      pendingReplies.delete(chatId);
      return;
    }

    try {
      const { type, orderId } = state;
      const order = await Order.findById(orderId);
      if (!order) {
        await bot.sendMessage(chatId, "Order not found.");
        pendingReplies.delete(chatId);
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
      pendingReplies.delete(chatId);
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
  buildOrderInlineKeyboard
};
