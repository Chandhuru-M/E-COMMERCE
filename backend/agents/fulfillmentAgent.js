// // backend/agents/fulfillmentAgent.js

// module.exports = {
//   scheduleDelivery: (order) => {
//     // Mock delivery timeline logic
//     const estimatedDays = 3 + Math.floor(Math.random() * 3); // 3–5 days
//     const today = new Date();
//     const deliveryDate = new Date(today.setDate(today.getDate() + estimatedDays));

//     return {
//       success: true,
//       orderId: order.orderId || "TEMP_ORDER",
//       deliveryDate: deliveryDate.toDateString(),
//       message: `Your order is confirmed! Expected delivery in ${estimatedDays} days.`,
//       address: order.shippingInfo?.address || "Home Delivery"
//     };
//   }
// };
const Order = require("../models/orderModel");
const postPurchaseAgent = require("./postPurchaseAgent");

module.exports = {
  // Step 1: When user places order
  scheduleDelivery: async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) return { success: false, error: `Order not found: ${orderId}. Please create the order first.` };

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

  // Step 2: When system updates shipment status
  updateDeliveryStatus: async (orderId, status) => {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    order.deliveryStatus = status;
    await order.save();

    // ✅ Auto trigger PostPurchaseAgent when delivered
    if (status === "Delivered") {
      await postPurchaseAgent.trigger(orderId);
    }

    return {
      success: true,
      message: `Order status updated to ${status}`,
      order
    };
  },

  // Step 3: Chatbot / UI compatible tracking
  getTrackingInfo: async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) return { error: "Order not found" };

    return {
      orderId: order._id,
      deliveryStatus: order.deliveryStatus,
      estimatedDelivery: order.estimatedDelivery
    };
  },

  // Step 4: Background processing
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
