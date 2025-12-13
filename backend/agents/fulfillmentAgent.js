
// const Order = require("../models/orderModel");
// const postPurchaseAgent = require("./postPurchaseAgent");

// module.exports = {
//   // Step 1: When user places order
//   scheduleDelivery: async (orderId) => {
//     const order = await Order.findById(orderId);
//     if (!order) return { success: false, error: `Order not found: ${orderId}. Please create the order first.` };

//     order.deliveryStatus = "Processing";

//     // Estimate delivery 3–5 days
//     let daysToAdd = Math.floor(Math.random() * 3) + 3;
//     const estimatedDate = new Date();
//     estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);

//     order.estimatedDelivery = estimatedDate;
//     await order.save();

//     return {
//       success: true,
//       message: "Delivery scheduled successfully.",
//       estimatedDelivery: order.estimatedDelivery,
//       status: order.deliveryStatus
//     };
//   },

//   // Step 2: When system updates shipment status
//   updateDeliveryStatus: async (orderId, status) => {
//     const order = await Order.findById(orderId);
//     if (!order) return { error: "Order not found" };

//     order.deliveryStatus = status;
//     await order.save();

//     // ✅ Auto trigger PostPurchaseAgent when delivered
//     if (status === "Delivered") {
//       await postPurchaseAgent.trigger(orderId);
//     }

//     return {
//       success: true,
//       message: `Order status updated to ${status}`,
//       order
//     };
//   },

//   // Step 3: Chatbot / UI compatible tracking
//   getTrackingInfo: async (orderId) => {
//     const order = await Order.findById(orderId);
//     if (!order) return { error: "Order not found" };

//     return {
//       orderId: order._id,
//       deliveryStatus: order.deliveryStatus,
//       estimatedDelivery: order.estimatedDelivery
//     };
//   },

//   // Step 4: Background processing
//   processOrder: async (orderId) => {
//     try {
//       const order = await Order.findById(orderId);
//       if (!order) return false;

//       order.orderStatus = "Processing";
//       await order.save();

//       console.log(`Order ${orderId} processed by Fulfillment Agent.`);
//       return true;
//     } catch (error) {
//       console.error("Fulfillment Agent Error:", error);
//       return false;
//     }
//   }
// };



// ==========================================
//  FulfillmentAgent.js (FULL UPDATED FILE)
// ==========================================

const Order = require("../models/orderModel");
const User = require("../models/userModel");
const postPurchaseAgent = require("./postPurchaseAgent");
const { bot } = require("../telegram/telegramBot");
 // <-- your bot instance

// Utility: Send telegram message safely
async function sendTelegram(chatId, text, buttons = null) {
  try {
    if (buttons) {
      return await bot.sendMessage(chatId, text, {
        reply_markup: { inline_keyboard: buttons }
      });
    } else {
      return await bot.sendMessage(chatId, text);
    }
  } catch (err) {
    console.log("Telegram send error:", err);
  }
}

module.exports = {

  // -------------------------------------------------------
  // STEP 1: When order is created, schedule delivery
  // -------------------------------------------------------
  scheduleDelivery: async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: `Order not found: ${orderId}` };
    }

    order.deliveryStatus = "Processing";

    // Estimate delivery 3–5 days
    let daysToAdd = Math.floor(Math.random() * 3) + 3;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);

    order.estimatedDelivery = estimatedDate;
    await order.save();

    return {
      success: true,
      message: "Delivery scheduled successfully.",
      estimatedDelivery: order.estimatedDelivery,
      status: order.deliveryStatus
    };
  },

  // -------------------------------------------------------
  // STEP 2: Update status & send Telegram notifications
  updateDeliveryStatus: async (orderId, status) => {
  const order = await Order.findById(orderId).populate("user");
  if (!order) return { error: "Order not found" };

  const oldStatus = order.deliveryStatus;
  order.deliveryStatus = status;
  await order.save();

  const chatId = order.user.telegramChatId;
  if (!chatId) return { success: true, message: "User not connected to Telegram" };

  let title = "";
  let text = "";
  let buttons = [];

  // ----------------------
  //  ORDER PLACED
  // ----------------------
  if (status === "Placed") {
    title = "🛒 Order Placed!";
    text =
      `Your order has been placed successfully.\n\n` +
      `🆔 *Order ID:* ${order._id}\n` +
      `📅 ETA: ${order.estimatedDelivery?.toDateString() || "Not set"}`;
  }

  // ----------------------
  //  SHIPPED
  // ----------------------
  if (status === "Shipped") {
    title = "📦 Order Shipped!";
    text =
      `Your order is now on the way.\n\n` +
      `🆔 *Order ID:* ${order._id}\n` +
      `🚚 Status: Shipped\n` +
      `📅 ETA: ${order.estimatedDelivery.toDateString()}`;

    if (order.trackingUrl) {
      buttons = [[{ text: "🔍 Track Now", url: order.trackingUrl }]];
    }
  }

  // ----------------------
  //  OUT FOR DELIVERY
  // ----------------------
  if (status === "Out for Delivery") {
    title = "🚚 Out for Delivery!";
    text =
      `Your order will reach you today.\n\n` +
      `🆔 *Order ID:* ${order._id}`;
  }

  // ----------------------
  //  DELIVERED
  // ----------------------
  if (status === "Delivered") {
    title = "🎉 Delivered!";
    text =
      `Your order has been delivered.\n\n` +
      `🆔 *Order ID:* ${order._id}\n` +
      `📅 Delivered on: ${new Date().toDateString()}`;

    buttons = [
      [{ text: "⭐ Give Feedback", callback_data: `feedback_${order._id}` }],
      [{ text: "⚠ Report Issue", callback_data: `issue_${order._id}` }],
      [{ text: "↩ Request Return", callback_data: `return_${order._id}` }]
    ];
  }

  // Send message through main Telegram bot system
  await sendTelegram(chatId, `*${title}*\n\n${text}`, buttons);

  // Trigger post-purchase assistant
  if (status === "Delivered") {
    await postPurchaseAgent.trigger(orderId);
  }

  return {
    success: true,
    message: `Order status updated to ${status}`,
    previousStatus: oldStatus,
    order
  };
},

  // -------------------------------------------------------
  // STEP 3: Tracking info for chatbot
  // -------------------------------------------------------
  getTrackingInfo: async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    return {
      orderId: order._id,
      deliveryStatus: order.deliveryStatus,
      estimatedDelivery: order.estimatedDelivery,
      trackingUrl: order.trackingUrl
    };
  },

  // -------------------------------------------------------
  // STEP 4: Background processing
  // -------------------------------------------------------
  processOrder: async (orderId) => {
    try {
      const order = await Order.findById(orderId);
      if (!order) return false;

      order.orderStatus = "Processing";
      await order.save();

      console.log(`Order ${orderId} processed by Fulfillment Agent.`);
      return true;
    } catch (error) {
      console.error("Fulfillment Agent Error:", error);
      return false;
    }
  }
};
