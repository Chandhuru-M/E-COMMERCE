

// telegram/telegramBot.js
const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/userModel");
const Order = require("../models/orderModel");

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


// --- In-memory pending reply state for chats that are asked to provide feedback/return/issue
// Map<chatId, { type: 'feedback'|'return'|'issue', orderId: string, userId?: string }>
const pendingReplies = new Map();

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
        [{ text: "📦 Show My Orders", callback_data: "menu_show_orders" }],
        [{ text: "🚚 Track an Order", callback_data: "menu_track_order" }],
        [{ text: "ℹ️ Help", callback_data: "menu_help" }]
      ]
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
    const user = await User.findById(payload);
    if (!user) {
      await bot.sendMessage(chatId, "❌ User not found. Please reconnect from your account on the website.");
      return;
    }

    // Save mapping
    user.telegramChatId = chatId;
    await user.save();

    await sendWelcomeAndConnect(chatId, user._id.toString());
    console.log(`Telegram: linked chat ${chatId} -> user ${user._id.toString()}`);
  } catch (err) {
    console.error("start handler error", err);
    try {
      await bot.sendMessage(chatId, "❌ Error connecting. Please try again later.");
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

// Export functions to be used by controllers
module.exports = {
  bot,
  sendOrderUpdateToUser,
  notifyOrderStatusChanged,
  buildOrderInlineKeyboard
};




// const TelegramBot = require("node-telegram-bot-api");
// const User = require("../models/userModel");
// const Order = require("../models/orderModel");

// const token = process.env.TELEGRAM_BOT_TOKEN;

// if (!token) {
//   console.error("❌ TELEGRAM_BOT_TOKEN missing.");
//   module.exports = {
//     bot: null,
//     notifyOrderStatusChanged: async () => {},
//   };
//   return;
// }

// const bot = new TelegramBot(token, { polling: true });

// // =======================================================
// // Pending Replies (feedback / return / issue)
// // =======================================================
// const pendingReplies = new Map();

// // =======================================================
// // Inline Keyboard Builder
// // =======================================================
// function buildOrderButtons(order) {
//   const orderId = order._id.toString();
//   const delivered = order.deliveryStatus === "Delivered";

//   const buttons = [];

//   // Always show Track button
//   buttons.push([
//     {
//       text: "🚚 Track Now",
//       callback_data: `track_${orderId}`,
//     },
//   ]);

//   // Only show Feedback / Return / Issue AFTER delivered
//   if (delivered) {
//     buttons.push([
//       { text: "⭐ Feedback", callback_data: `feedback_${orderId}` },
//       { text: "↩️ Return", callback_data: `return_${orderId}` },
//     ]);

//     buttons.push([
//       { text: "⚠️ Report Issue", callback_data: `issue_${orderId}` },
//     ]);
//   }

//   return { reply_markup: { inline_keyboard: buttons } };
// }

// // =======================================================
// // Auto-send updates when order status changes
// // =======================================================
// async function notifyOrderStatusChanged(order) {
//   try {
//     const user = await User.findById(order.user);
//     if (!user || !user.telegramChatId) return;

//     const chatId = user.telegramChatId;
//     let msg = "";

//     // -----------------------------
//     // SHIPPED
//     // -----------------------------
//     if (order.deliveryStatus === "Shipped") {
//       msg = `📦 *Your order #${order._id} has been shipped!*\n\nEstimated Delivery: *${order.estimatedDelivery?.toLocaleDateString() || "Not available"}*`;
//     }

//     // -----------------------------
//     // OUT FOR DELIVERY
//     // -----------------------------
//     else if (order.deliveryStatus === "Out for Delivery") {
//       msg = `🚚 *Your order #${order._id} is out for delivery.*\nIt will arrive today!`;
//     }

//     // -----------------------------
//     // DELIVERED
//     // -----------------------------
//     else if (order.deliveryStatus === "Delivered") {
//       msg = `🎉 *Your order #${order._id} has been delivered!*\n\nHow was your experience?`;
//     }

//     // -----------------------------
//     // ANY OTHER STATUS
//     // -----------------------------
//     else {
//       msg = `📦 Order #${order._id} status updated: *${order.deliveryStatus}*`;
//     }

//     await bot.sendMessage(chatId, msg, {
//       parse_mode: "Markdown",
//       ...buildOrderButtons(order),
//     });
//   } catch (err) {
//     console.error("Telegram notify error:", err);
//   }
// }

// // =======================================================
// // /start Handler (link user account)
// // =======================================================
// bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
//   const chatId = msg.chat.id;
//   const userId = match?.[1];

//   if (!userId || userId === "undefined") {
//     return bot.sendMessage(
//       chatId,
//       "Welcome! 👋\n\nPlease choose an option:",
//       {
//         reply_markup: {
//           keyboard: [
//             [{ text: "📦 Show My Orders" }],
//             [{ text: "🚚 Track an Order" }],
//             [{ text: "ℹ Help" }]
//           ],
//           resize_keyboard: true
//         }
//       }
//     );
//   }

//   const user = await User.findById(userId);
//   if (!user) return bot.sendMessage(chatId, "❌ User not found.");

//   user.telegramChatId = chatId;
//   await user.save();

//   bot.sendMessage(
//     chatId,
//     "✅ Your Telegram is now linked to your account!\n\nChoose an option:",
//     {
//       reply_markup: {
//         keyboard: [
//           [{ text: "📦 Show My Orders" }],
//           [{ text: "🚚 Track an Order" }],
//           [{ text: "ℹ Help" }]
//         ],
//         resize_keyboard: true
//       }
//     }
//   );
// });

// // =======================================================
// // /orders → Show last 5 orders
// // =======================================================
// bot.onText(/\/orders/, async (msg) => {
//   const chatId = msg.chat.id;
//   const user = await User.findOne({ telegramChatId: chatId });

//   if (!user) return bot.sendMessage(chatId, "❌ Please link your account using Connect Telegram.");

//   const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);

//   if (orders.length === 0) return bot.sendMessage(chatId, "📭 You have no orders.");

//   for (const order of orders) {
//     const details = `📦 *Order ID:* ${order._id}\n` +
//       `📌 Status: *${order.deliveryStatus}*\n` +
//       `📅 ETA: ${order.estimatedDelivery?.toLocaleDateString() || "Not available"}`;

//     await bot.sendMessage(chatId, details, {
//       parse_mode: "Markdown",
//       ...buildOrderButtons(order),
//     });
//   }
// });

// // =======================================================
// // Natural language commands
// // =======================================================
// bot.on("message", async (msg) => {
//   if (!msg.text || msg.text.startsWith("/")) return;

//   const text = msg.text.toLowerCase();
//   const chatId = msg.chat.id;
// const TelegramBot = require("node-telegram-bot-api");
// const User = require("../models/userModel");
// const Order = require("../models/orderModel");

// const token = process.env.TELEGRAM_BOT_TOKEN;

// if (!token) {
//   console.error("❌ TELEGRAM_BOT_TOKEN missing.");
//   module.exports = {
//     bot: null,
//     notifyOrderStatusChanged: async () => {},
//   };
//   return;
// }

// const bot = new TelegramBot(token, { polling: true });

// // =======================================================
// // Pending Replies (feedback / return / issue)
// // =======================================================
// const pendingReplies = new Map();

// // =======================================================
// // Inline Keyboard Builder
// // =======================================================
// function buildOrderButtons(order) {
//   const orderId = order._id.toString();
//   const delivered = order.deliveryStatus === "Delivered";

//   const buttons = [];

//   // Always show Track button
//   buttons.push([
//     {
//       text: "🚚 Track Now",
//       callback_data: `track_${orderId}`,
//     },
//   ]);

//   // Only show Feedback / Return / Issue AFTER delivered
//   if (delivered) {
//     buttons.push([
//       { text: "⭐ Feedback", callback_data: `feedback_${orderId}` },
//       { text: "↩️ Return", callback_data: `return_${orderId}` },
//     ]);

//     buttons.push([
//       { text: "⚠️ Report Issue", callback_data: `issue_${orderId}` },
//     ]);
//   }

//   return { reply_markup: { inline_keyboard: buttons } };
// }

// // =======================================================
// // Auto-send updates when order status changes
// // =======================================================
// async function notifyOrderStatusChanged(order) {
//   try {
//     const user = await User.findById(order.user);
//     if (!user || !user.telegramChatId) return;

//     const chatId = user.telegramChatId;
//     let msg = "";

//     if (order.deliveryStatus === "Shipped") {
//       msg = `📦 *Your order #${order._id} has been shipped!*\n\nEstimated Delivery: *${order.estimatedDelivery?.toLocaleDateString() || "Not available"}*`;
//     } else if (order.deliveryStatus === "Out for Delivery") {
//       msg = `🚚 *Your order #${order._id} is out for delivery.*\nIt will arrive today!`;
//     } else if (order.deliveryStatus === "Delivered") {
//       msg = `🎉 *Your order #${order._id} has been delivered!*\n\nHow was your experience?`;
//     } else {
//       msg = `📦 Order #${order._id} status updated: *${order.deliveryStatus}*`;
//     }

//     await bot.sendMessage(chatId, msg, {
//       parse_mode: "Markdown",
//       ...buildOrderButtons(order),
//     });
//   } catch (err) {
//     console.error("Telegram notify error:", err);
//   }
// }

// // =======================================================
// // /start Handler (with menu)
// // =======================================================
// bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
//   const chatId = msg.chat.id;
//   const userId = match?.[1];

//   // If opened without linking
//   if (!userId || userId === "undefined") {
//     return bot.sendMessage(
//       chatId,
//       "Welcome! 👋\n\nPlease choose an option:",
//       {
//         reply_markup: {
//           keyboard: [
//             [{ text: "📦 Show My Orders" }],
//             [{ text: "🚚 Track an Order" }],
//             [{ text: "ℹ Help" }]
//           ],
//           resize_keyboard: true
//         }
//       }
//     );
//   }

//   const user = await User.findById(userId);
//   if (!user) return bot.sendMessage(chatId, "❌ User not found.");

//   user.telegramChatId = chatId;
//   await user.save();

//   bot.sendMessage(
//     chatId,
//     "✅ Your Telegram is now linked to your account!\n\nChoose an option:",
//     {
//       reply_markup: {
//         keyboard: [
//           [{ text: "📦 Show My Orders" }],
//           [{ text: "🚚 Track an Order" }],
//           [{ text: "ℹ Help" }]
//         ],
//         resize_keyboard: true
//       }
//     }
//   );
// });

// // =======================================================
// // /orders → Show last 5 orders
// // =======================================================
// bot.onText(/\/orders/, async (msg) => {
//   const chatId = msg.chat.id;
//   const user = await User.findOne({ telegramChatId: chatId });

//   if (!user) return bot.sendMessage(chatId, "❌ Please link your account using Connect Telegram.");

//   const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);

//   if (orders.length === 0) return bot.sendMessage(chatId, "📭 You have no orders.");

//   for (const order of orders) {
//     const details = `📦 *Order ID:* ${order._id}\n` +
//       `📌 Status: *${order.deliveryStatus}*\n` +
//       `📅 ETA: ${order.estimatedDelivery?.toLocaleDateString() || "Not available"}`;

//     await bot.sendMessage(chatId, details, {
//       parse_mode: "Markdown",
//       ...buildOrderButtons(order),
//     });
//   }
// });

// // =======================================================
// // Natural language menu buttons
// // =======================================================
// bot.on("message", async (msg) => {
//   if (!msg.text || msg.text.startsWith("/")) return;

//   const text = msg.text.toLowerCase();
//   const chatId = msg.chat.id;

//   const user = await User.findOne({ telegramChatId: chatId });
//   if (!user) return;

//   const pending = pendingReplies.get(chatId);
//   if (pending) return; // skip, handled below

//   // MENU: Show My Orders
//   if (text === "📦 show my orders" || text === "show my orders") {
//     const orders = await Order.find({ user: user._id })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     if (orders.length === 0)
//       return bot.sendMessage(chatId, "📭 You have no orders.");

//     for (const order of orders) {
//       const msgText = `🆔 *Order ${order._id}*\nStatus: *${order.deliveryStatus}*\nETA: ${order.estimatedDelivery?.toLocaleDateString()}`;

//       await bot.sendMessage(chatId, msgText, {
//         parse_mode: "Markdown",
//         ...buildOrderButtons(order),
//       });
//     }
//   }

//   // MENU: Track an Order
//   if (text === "🚚 track an order" || text === "track an order") {
//     const orders = await Order.find({ user: user._id })
//       .sort({ createdAt: -1 })
//       .limit(5);

//     bot.sendMessage(chatId, "📦 Select an order to track:");
//     for (const order of orders) {
//       const msgText = `🆔 *Order ${order._id}*\nStatus: *${order.deliveryStatus}*\nETA: ${order.estimatedDelivery?.toLocaleDateString()}`;

//       await bot.sendMessage(chatId, msgText, {
//         parse_mode: "Markdown",
//         ...buildOrderButtons(order),
//       });
//     }
//   }

//   // MENU: Help
//   if (text === "ℹ help" || text === "help") {
//     return bot.sendMessage(
//       chatId,
//       "ℹ **Help Menu**:\n\n" +
//       "📦 *Show My Orders* → View your last 5 orders\n" +
//       "🚚 *Track an Order* → Get live tracking updates\n" +
//       "⭐ *Feedback* → After delivery\n" +
//       "↩️ *Return* → Submit a return request\n" +
//       "⚠️ *Report Issue* → Report delivery/product issues",
//       { parse_mode: "Markdown" }
//     );
//   }
// });

// // =======================================================
// // Callback Buttons
// // =======================================================
// bot.on("callback_query", async (query) => {
//   const chatId = query.message.chat.id;
//   const data = query.data;

//   await bot.answerCallbackQuery(query.id);

//   // TRACK
//   if (data.startsWith("track_")) {
//     const id = data.replace("track_", "");
//     const order = await Order.findById(id);

//     const text =
//       `📦 *Tracking Order #${order._id}*\n` +
//       `📌 Status: *${order.deliveryStatus}*\n` +
//       `📅 ETA: ${order.estimatedDelivery?.toLocaleDateString() || "N/A"}\n` +
//       `🔗 Tracking: ${order.trackingUrl || "Not available"}`;

//     return bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
//   }

//   // FEEDBACK / ISSUE / RETURN
//   const [action, orderId] = data.split("_");

//   pendingReplies.set(chatId, { action, orderId });

//   if (action === "feedback")
//     return bot.sendMessage(chatId, "⭐ Please type your feedback.");

//   if (action === "return")
//     return bot.sendMessage(chatId, "↩️ Please explain why you want to return the item.");

//   if (action === "issue")
//     return bot.sendMessage(chatId, "⚠️ Please describe the issue.");
// });

// // =======================================================
// // Handle Feedback / Return / Issue text input
// // =======================================================
// bot.on("message", async (msg) => {
//   if (!msg.text || msg.text.startsWith("/")) return;

//   const chatId = msg.chat.id;
//   const pending = pendingReplies.get(chatId);
//   if (!pending) return;

//   const { action, orderId } = pending;
//   const order = await Order.findById(orderId);

//   // FEEDBACK
//   if (action === "feedback") {
//     order.feedback = {
//       rating: null,
//       comment: msg.text,
//       submittedAt: new Date(),
//     };
//     await order.save();
//     bot.sendMessage(chatId, "⭐ Thank you for your feedback!");
//   }

//   // RETURN
//   if (action === "return") {
//     order.returnRequested = true;
//     order.returnReason = msg.text;
//     order.returnStatus = "Requested";
//     await order.save();
//     bot.sendMessage(chatId, "↩️ Return request submitted.");
//   }

//   // ISSUE
//   if (action === "issue") {
//     order.issueDescription = msg.text;
//     order.issueStatus = "Open";
//     await order.save();
//     bot.sendMessage(chatId, "⚠️ Issue reported.");
//   }

//   pendingReplies.delete(chatId);
// });

// // EXPORTS
// module.exports = {
//   bot,
//   notifyOrderStatusChanged,
// };
