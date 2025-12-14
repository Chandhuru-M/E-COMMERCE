const Order = require("../models/orderModel");

exports.getAnalytics = async (req, res) => {
  const today = new Date();
  today.setHours(0,0,0,0);

  const orders = await Order.find({
    createdAt: { $gte: today }
  });

  const totalSales = orders.reduce((s,o)=>s+o.totalPrice,0);

  res.json({
    totalOrders: orders.length,
    totalSales,
    paymentSplit: {
      cash: orders.filter(o=>o.paymentInfo.id==="CASH").length,
      card: orders.filter(o=>o.paymentInfo.id==="CARD").length,
      upi: orders.filter(o=>o.paymentInfo.id==="UPI").length
    }
  });
};
