const Order = require("../models/orderModel");

module.exports = {
  /**
   * Get the latest orders for a user
   * @param {string} userId 
   * @param {number} limit 
   */
  async getMyOrders(userId, limit = 5) {
    if (!userId) {
      return { error: "User not logged in. Please log in to view orders." };
    }

    try {
      const orders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("orderStatus totalPrice orderItems createdAt");

      if (!orders || orders.length === 0) {
        return { message: "You have no orders yet." };
      }

      return orders.map(order => ({
        id: order._id,
        status: order.orderStatus,
        total: order.totalPrice,
        date: order.createdAt.toISOString().split('T')[0],
        items: order.orderItems.map(item => `${item.name} (x${item.quantity})`).join(", ")
      }));
    } catch (error) {
      console.error("Error fetching orders:", error);
      return { error: "Failed to fetch orders." };
    }
  },

  /**
   * Track a specific order by ID
   * @param {string} orderId 
   */
  async trackOrder(orderId) {
    try {
      const order = await Order.findById(orderId).select("orderStatus totalPrice orderItems shippingInfo paymentInfo");
      
      if (!order) {
        return { error: `Order #${orderId} not found.` };
      }

      return {
        id: order._id,
        status: order.orderStatus,
        total: order.totalPrice,
        items: order.orderItems.map(item => item.name),
        shippingAddress: order.shippingInfo ? `${order.shippingInfo.city}, ${order.shippingInfo.country}` : "N/A",
        paymentStatus: order.paymentInfo?.status || "Unknown"
      };
    } catch (error) {
      console.error("Error tracking order:", error);
      return { error: "Invalid Order ID or system error." };
    }
  }
};
