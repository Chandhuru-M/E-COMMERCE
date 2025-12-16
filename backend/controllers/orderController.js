const catchAsyncError = require("../middlewares/catchAsyncError");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const telegramBot = require("../telegram/telegramBot");
const User = require("../models/userModel");
const RecommendationEngine = require("../services/recommendationEngine");
const { sendNotificationEmail, sendOrderReceiptEmail } = require('../services/emailService');
const STATUS_FLOW = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];


// // ==========================================================
// // SAFE TELEGRAM SENDER (PRODUCTION SAFE)
// // ==========================================================
// async function sendTelegram(userId, text, buttons = null) {
//   try {
//     console.log("🟡 sendTelegram called for user:", userId);

//     if (!bot) {
//       console.log("🔴 Telegram bot not initialized");
//       return;
//     }

//     const user = await User.findById(userId);
//     if (!user || !user.telegramChatId) {
//       console.log("🔴 Telegram not linked for user");
//       return;
//     }

//     const options = {
//       parse_mode: "Markdown",
//       ...(buttons && { reply_markup: { inline_keyboard: buttons } }),
//     };

//     console.log("📤 Telegram →", user.telegramChatId);
//     await bot.sendMessage(user.telegramChatId, text, options);
//     console.log("✅ Telegram message sent");
//   } catch (err) {
//     console.error("❌ Telegram Send Error:", err.message);
//   }
// }

// // ==========================================================
// // CREATE NEW ORDER
// // POST /api/v1/order/new
// // ==========================================================
// exports.newOrder = catchAsyncError(async (req, res) => {
//   console.log("🟢 NEW ORDER CONTROLLER HIT");

//   const {
//     orderItems,
//     shippingInfo,
//     itemsPrice,
//     taxPrice,
//     shippingPrice,
//     totalPrice,
//     paymentInfo,
//   } = req.body;

//   const order = await Order.create({
//     orderItems,
//     shippingInfo,
//     itemsPrice,
//     taxPrice,
//     shippingPrice,
//     totalPrice,
//     paymentInfo,
//     paidAt: Date.now(),
//     user: req.user.id,
//     orderStatus: "Processing",
//     deliveryStatus: "Pending",
//   });

//   console.log("🟢 ORDER CREATED:", order._id);

//   await sendTelegram(
//     order.user,
//     `🛒 *Order Placed Successfully!*\n\n🆔 Order ID: ${order._id}\n💰 Total: ₹${order.totalPrice}`
//   );

//   res.status(200).json({
//     success: true,
//     order,
//   });
// });

// // ==========================================================
// // GET SINGLE ORDER
// // ==========================================================
// exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
//   const order = await Order.findById(req.params.id).populate(
//     "user",
//     "name email"
//   );

//   if (!order)
//     return next(new ErrorHandler("Order not found with this ID", 404));

//   res.status(200).json({
//     success: true,
//     order,
//   });
// });

// // ==========================================================
// // GET LOGGED IN USER ORDERS
// // ==========================================================
// exports.myOrders = catchAsyncError(async (req, res) => {
//   const orders = await Order.find({ user: req.user.id });

//   res.status(200).json({
//     success: true,
//     orders,
//   });
// });

// // ==========================================================
// // ADMIN: GET ALL ORDERS
// // ==========================================================
// exports.getAllOrders = catchAsyncError(async (req, res) => {
//   const orders = await Order.find();
//   let totalAmount = 0;

//   orders.forEach((order) => {
//     totalAmount += order.totalPrice;
//   });

//   res.status(200).json({
//     success: true,
//     totalAmount,
//     orders,
//   });
// });

// // ==========================================================
// // UPDATE ORDER STATUS (ADMIN)
// // PUT /api/v1/admin/order/:id
// // ==========================================================
// exports.updateOrder = catchAsyncError(async (req, res, next) => {
//   console.log("🔥 UPDATE ORDER CONTROLLER HIT", req.body);

//   const order = await Order.findById(req.params.id);
//   if (!order) return next(new ErrorHandler("Order not found", 404));

//   if (order.deliveryStatus === "Delivered") {
//     return next(new ErrorHandler("Order already delivered", 400));
//   }

//   // Update stock
//   for (const item of order.orderItems) {
//     await updateStock(item.product, item.quantity);
//   }

//   if (req.body.orderStatus) order.orderStatus = req.body.orderStatus;
//   if (req.body.deliveryStatus) order.deliveryStatus = req.body.deliveryStatus;
//   if (req.body.trackingId) order.trackingId = req.body.trackingId;
//   if (req.body.trackingUrl) order.trackingUrl = req.body.trackingUrl;
//   if (req.body.estimatedDelivery)
//     order.estimatedDelivery = req.body.estimatedDelivery;

//   const rawStatus =
//   req.body.deliveryStatus ||
//   req.body.orderStatus ||
//   req.body.status ||
//   "";

// const status = rawStatus.toString().trim().toLowerCase();


//   if (status === "delivered") {
//     order.deliveredAt = Date.now();
//   }

//   await order.save();

//   // ================= TELEGRAM EVENTS =================

//   if (status === "shipped") {
//   await sendTelegram(
//     order.user,
//     `🚚 *Order Shipped!*\n\n🆔 Order ID: ${order._id}\n📦 Tracking ID: ${
//       order.trackingId || "N/A"
//     }\n📅 ETA: ${
//       order.estimatedDelivery
//         ? new Date(order.estimatedDelivery).toDateString()
//         : "Updating soon"
//     }`
//   );
// }

// if (status === "delivered") {
//   await sendTelegram(
//     order.user,
//     `🎉 *Order Delivered!*\n\n🆔 Order ID: ${order._id}\nHope you enjoyed your purchase 💖`,
//     [
//       [
//         { text: "⭐ Feedback", callback_data: `feedback_${order._id}` },
//         { text: "↩️ Return", callback_data: `return_${order._id}` },
//       ],
//       [{ text: "⚠️ Report Issue", callback_data: `issue_${order._id}` }],
//     ]
//   );
// }
// console.log("🌐 WEBSITE PAYLOAD:", req.body);
// function pushTracking(order, key, label) {
//   order.trackingTimeline.push({
//     key,
//     label,
//     time: new Date()
//   });
// }
// if (status === "shipped") {
//   pushTracking(order, "SHIPPED", "Order Shipped");
// }

// if (status === "delivered") {
//   pushTracking(order, "DELIVERED", "Delivered");
// }



//   res.status(200).json({
//     success: true,
//     order,
//   });
// });

// // ==========================================================
// // TRACK ORDER
// // ==========================================================
// exports.trackOrder = catchAsyncError(async (req, res, next) => {
//   const order = await Order.findById(req.params.id);

//   if (!order) return next(new ErrorHandler("Order not found", 404));

//   res.status(200).json({
//     success: true,
//     tracking: {
//       status: order.deliveryStatus || order.orderStatus,
//       estimatedDelivery: order.estimatedDelivery || null,
//       trackingId: order.trackingId || null,
//       trackingUrl: order.trackingUrl || null,
//     },
//   });
// });

// // ==========================================================
// // GIVE FEEDBACK
// // ==========================================================
// exports.giveFeedback = catchAsyncError(async (req, res, next) => {
//   const { rating, comment } = req.body;
//   const order = await Order.findById(req.params.id);

//   if (!order) return next(new ErrorHandler("Order not found", 404));

//   order.feedback = {
//     rating,
//     comment,
//     submittedAt: new Date(),
//   };

//   await order.save();

//   res.status(200).json({
//     success: true,
//     message: "Feedback submitted successfully",
//   });
// });

// // ==========================================================
// // REQUEST RETURN
// // ==========================================================
// exports.requestReturn = catchAsyncError(async (req, res, next) => {
//   const { reason } = req.body;
//   const order = await Order.findById(req.params.id);

//   if (!order) return next(new ErrorHandler("Order not found", 404));

//   order.returnRequested = true;
//   order.returnReason = reason;
//   order.returnStatus = "Requested";

//   await order.save();

//   await sendTelegram(
//     order.user,
//     `↩️ *Return Requested*\n\n🆔 Order ID: ${order._id}\n📝 Reason: ${reason}`
//   );

//   res.status(200).json({
//     success: true,
//     message: "Return request submitted",
//   });
// });

// // ==========================================================
// // REPORT ISSUE
// // ==========================================================
// exports.reportIssue = catchAsyncError(async (req, res, next) => {
//   const { issueType, issueDescription } = req.body;
//   const order = await Order.findById(req.params.id);

//   if (!order) return next(new ErrorHandler("Order not found", 404));

//   order.issueType = issueType;
//   order.issueDescription = issueDescription;
//   order.issueStatus = "Open";

//   await order.save();

//   await sendTelegram(
//     order.user,
//     `⚠️ *Issue Reported*\n\n🆔 Order ID: ${order._id}\nType: ${issueType}\n${issueDescription}`
//   );

//   res.status(200).json({
//     success: true,
//     message: "Issue reported successfully",
//   });
// });

// // ==========================================================
// // DELETE ORDER (ADMIN)
// // ==========================================================
// exports.deleteOrder = catchAsyncError(async (req, res, next) => {
//   const order = await Order.findById(req.params.id);

//   if (!order)
//     return next(new ErrorHandler("Order not found with this ID", 404));

//   await order.deleteOne();

//   res.status(200).json({
//     success: true,
//     message: "Order deleted successfully",
//   });
// });
// exports.trackOrder = catchAsyncError(async (req, res) => {
//   const order = await Order.findById(req.params.id);

//   res.status(200).json({
//     success: true,
//     tracking: {
//       status: order.deliveryStatus,
//       timeline: order.trackingTimeline,
//     },
//   });
// });


// // ==========================================================
// // STOCK UPDATE HELPER
// // ==========================================================
// async function updateStock(productId, quantity) {
//   const product = await Product.findById(productId);
//   if (!product) return;

//   product.stock -= quantity;
//   await product.save({ validateBeforeSave: false });
// }





// ==========================================================
// TELEGRAM SENDER (SAFE)
// ==========================================================
async function sendTelegram(userId, text, buttons = null) {
  try {
    const bot = telegramBot.bot;
    if (!bot) {
      console.log('🔴 Telegram bot not initialized yet');
      return;
    }

    const user = await User.findById(userId);
    if (!user || !user.telegramChatId) {
      console.log('🔴 Telegram not linked for user', userId);
      return;
    }

    const options = {
      parse_mode: "Markdown",
      ...(buttons && { reply_markup: { inline_keyboard: buttons } }),
    };

    await bot.sendMessage(user.telegramChatId, text, options);
  } catch (err) {
    console.error("Telegram Error:", err.message);
  }
}

// ==========================================================
// HELPER: PUSH TRACKING (NO DUPLICATES)
// ==========================================================
function pushTracking(order, key, label) {
  if (!order.trackingTimeline) order.trackingTimeline = [];

  const exists = order.trackingTimeline.some(t => t.key === key);
  if (!exists) {
    order.trackingTimeline.push({
      key,
      label,
      time: new Date(),
    });
  }
}

// ==========================================================
// CREATE NEW ORDER
// ==========================================================
exports.newOrder = catchAsyncError(async (req, res) => {
  const {
    orderItems,
    shippingInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
  } = req.body;

  // Resolve FakeStore products in orderItems
  if (orderItems && orderItems.length > 0) {
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (typeof item.product === 'string' && item.product.startsWith("FAKESTORE_")) {
        const realProduct = await RecommendationEngine.resolveFakeProduct(item.product);
        if (realProduct) {
          item.product = realProduct._id;
        } else {
          // If we can't resolve it, we might want to fail or skip. 
          // Failing is safer to avoid data inconsistency.
          throw new ErrorHandler(`Could not resolve product: ${item.name}`, 400);
        }
      }
    }
  }

  const order = await Order.create({
    orderItems,
    shippingInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
    paidAt: Date.now(),
    user: req.user.id,

    orderStatus: "PLACED",
    deliveryStatus: "PLACED",

    trackingTimeline: [
      { key: "PLACED", label: "Order Placed", time: new Date() },
    ],
  });

  await sendTelegram(
    order.user,
    `🛒 *Order Placed Successfully!*\n\n🆔 Order ID: ${order._id}\n💰 Total: ₹${order.totalPrice}`
  );

  // Send order confirmation email to user
  try {
    const userDoc = await User.findById(order.user);
    if (userDoc && userDoc.email) {
      const subject = `Order Placed: ${order._id}`;
      const itemsHtml = (order.orderItems || []).map(it => {
        const name = (it.name || (it.product && it.product.name) || 'Product');
        const id = (it.product && it.product._id) ? String(it.product._id) : (it.product || 'N/A');
        const qty = it.quantity || it.qty || 1;
        const price = it.price || it.pricePerUnit || '';
        return `<li>${name} (ID: ${id}) x${qty} ${price ? '- ₹' + price : ''}</li>`;
      }).join('');

      const html = `
        <h2>Order Placed Successfully</h2>
        <p>Hi ${userDoc.name || 'Customer'},</p>
        <p>Thank you for your order. Your order ID is <strong>${order._id}</strong>.</p>
        <p><strong>Total:</strong> ₹${order.totalPrice}</p>
        <h3>Items</h3>
        <ul>${itemsHtml}</ul>
        <p>We will notify you when your order ships.</p>
      `;

      const emailRes = await sendOrderReceiptEmail(order, userDoc);
      console.log('Order confirmation email (with PDF) sent:', emailRes);
    } else {
      console.log('No user email found for order notification');
    }
  } catch (emailErr) {
    console.error('Error sending order confirmation email:', emailErr?.message || emailErr);
  }

  res.status(201).json({ success: true, order });
});

// ==========================================================
// GET SINGLE ORDER
// ==========================================================
exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return next(new ErrorHandler("Order not found", 404));
  res.status(200).json({ success: true, order });
});

// ==========================================================
// USER ORDERS
// ==========================================================
exports.myOrders = catchAsyncError(async (req, res) => {
  const orders = await Order.find({ user: req.user.id });
  res.status(200).json({ success: true, orders });
});

//Admin: Get All Orders - api/v1/orders (supports merchantId filter)
exports.orders = catchAsyncError(async (req, res, next) => {
    let query = {};
    
    // Support filtering by merchantId for merchant dashboard
    if (req.query.merchantId) {
        query.merchantId = req.query.merchantId;
    }
    
    const orders = await Order.find(query).populate('user', 'name email').sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: orders.length,
        orders
    });
});

// ==========================================================
// ADMIN: ALL ORDERS
// ==========================================================
exports.getAllOrders = catchAsyncError(async (req, res) => {
  const orders = await Order.find();
  const totalAmount = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  res.status(200).json({ success: true, totalAmount, orders });
});

// ==========================================================
// ADMIN: UPDATE ORDER
// ==========================================================
exports.updateOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  const rawStatus =
    req.body.deliveryStatus ||
    req.body.orderStatus ||
    req.body.status ||
    "";

  const status = rawStatus
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (status) {
    order.deliveryStatus = status;
    order.orderStatus = status;
  }

  if (req.body.trackingId) order.trackingId = req.body.trackingId;
  if (req.body.trackingUrl) order.trackingUrl = req.body.trackingUrl;
  if (req.body.estimatedDelivery)
    order.estimatedDelivery = req.body.estimatedDelivery;

  // ================= TRACKING FLOW =================
  if (status === "CONFIRMED") pushTracking(order, "CONFIRMED", "Order Confirmed");
  

  if (status === "SHIPPED") {
    pushTracking(order, "SHIPPED", "Order Shipped");

    await sendTelegram(
      order.user,
      `🚚 *Order Shipped!*\n\n🆔 Order ID: ${order._id}\n📦 Tracking ID: ${
        order.trackingId || "N/A"
      }\n📅 ETA: ${
        order.estimatedDelivery
          ? new Date(order.estimatedDelivery).toDateString()
          : "Updating soon"
      }`
    );
  }

  if (status === "DELIVERED") {
    pushTracking(order, "DELIVERED", "Delivered");
    order.deliveredAt = Date.now();

    // 🔥 UPDATE STOCK ONLY ON DELIVERY
    for (const item of order.orderItems) {
      await updateStock(item.product, item.quantity);
    }

    await sendTelegram(
      order.user,
      `🎉 *Order Delivered!*\n\n🆔 Order ID: ${order._id}`,
      [
        [
          { text: "⭐ Feedback", callback_data: `feedback_${order._id}` },
          { text: "↩️ Return", callback_data: `return_${order._id}` },
        ],
        [{ text: "⚠️ Report Issue", callback_data: `issue_${order._id}` }],
      ]
    );
  }

  await order.save();
  res.status(200).json({ success: true, order });
});

// ==========================================================
// TRACK ORDER (WEBSITE)
// ==========================================================
exports.trackOrder = catchAsyncError(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false });

  res.status(200).json({
    success: true,
    tracking: {
      status: order.deliveryStatus,
      estimatedDelivery: order.estimatedDelivery || null,
      trackingId: order.trackingId || null,
      trackingUrl: order.trackingUrl || null,
      timeline: order.trackingTimeline || [],
    },
  });
});

// ==========================================================
// FEEDBACK
// ==========================================================
exports.giveFeedback = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  order.feedback = {
    rating: req.body.rating,
    comment: req.body.comment,
    submittedAt: new Date(),
  };

  await order.save();
  res.status(200).json({ success: true, message: "Feedback submitted" });
});

// ==========================================================
// RETURN REQUEST
// ==========================================================
exports.requestReturn = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  order.returnRequested = true;
  order.returnReason = req.body.reason;
  order.returnStatus = "REQUESTED";

  await order.save();

  await sendTelegram(
    order.user,
    `↩️ *Return Requested*\n\n🆔 Order ID: ${order._id}\n📝 Reason: ${req.body.reason}`
  );

  res.status(200).json({ success: true, message: "Return requested" });
});

// ==========================================================
// REPORT ISSUE
// ==========================================================
exports.reportIssue = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  order.issueType = req.body.issueType;
  order.issueDescription = req.body.issueDescription;
  order.issueStatus = "OPEN";

  await order.save();

  await sendTelegram(
    order.user,
    `⚠️ *Issue Reported*\n\n🆔 Order ID: ${order._id}\n${req.body.issueDescription}`
  );

  res.status(200).json({ success: true, message: "Issue reported" });
});

// ==========================================================
// DELETE ORDER (ADMIN)
// ==========================================================
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorHandler("Order not found", 404));

  await order.deleteOne();
  res.status(200).json({ success: true, message: "Order deleted" });
});

// ==========================================================
// STOCK HELPER
// ==========================================================
async function updateStock(productId, quantity) {
  const product = await Product.findById(productId);
  if (!product) return;
  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
}
