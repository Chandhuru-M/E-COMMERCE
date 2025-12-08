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

module.exports = {
  scheduleDelivery: async (orderId) => {
    const order = await Order.findById(orderId);

    if (!order) {
      return { error: "Order not found" };
    }

    // 1️⃣ Set processing status
    order.deliveryStatus = "Processing";

    // 2️⃣ Calculate estimated delivery date (3–5 days)
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

  updateDeliveryStatus: async (orderId, status) => {
    const order = await Order.findById(orderId);

    if (!order) return { error: "Order not found" };

    order.deliveryStatus = status;
    await order.save();

    return {
      success: true,
      message: `Order status updated to ${status}`,
      order
    };
  },

  processOrder: async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) return;

        // Simulate processing delay
        order.orderStatus = 'Processing';
        await order.save();
        
        console.log(`Order ${orderId} is being processed by Fulfillment Agent.`);
        return true;
    } catch (error) {
        console.error("Fulfillment Agent Error:", error);
        return false;
    }
  }
};

