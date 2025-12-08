// backend/controllers/loyaltyController.js
const catchAsyncError = require('../middlewares/catchAsyncError');
const loyaltyAgent = require('../services/loyaltyAgent');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const mongoose = require('mongoose');

/**
 * GET /api/v1/loyalty/check
 * Returns current loyalty points and a small summary (no cart required)
 */
exports.checkLoyalty = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user.id).select('loyaltyPoints').lean();
  res.status(200).json({ success: true, loyaltyPoints: user?.loyaltyPoints || 0 });
});

/**
 * POST /api/v1/loyalty/apply
 * Body: { cartItems: [{ productId, quantity }], shipping?: number, tax?: number, maxPointsToUse?: number (optional) }
 *
 * Returns final pricing after promotions & loyalty suggestion:
 * {
 *   success: true,
 *   promotions: { items, subtotal },
 *   loyalty: { pointsSuggested, pointsValue, totalAfterPoints, totalPayable },
 *   earnedPointsEstimate
 * }
 */
exports.applyLoyalty = catchAsyncError(async (req, res) => {
  const userId = req.user?.id || null;
  const { cartItems = [], shipping = 0, tax = 0, maxPointsToUse = null } = req.body;

  // 1) calculate promotions (per-product discounts)
  const promo = await loyaltyAgent.calculatePromotions(cartItems);

  // 2) get user points
  let userPoints = 0;
  if (userId) {
    const user = await User.findById(userId).select('loyaltyPoints').lean();
    userPoints = user?.loyaltyPoints || 0;
  }

  // 3) compute loyalty suggestion
  const loyalty = loyaltyAgent.computeLoyaltyAndTotals({
    userPoints,
    subtotal: promo.subtotal,
    shipping,
    tax,
    maxPointsToUse
  });

  // 4) estimated earned points (after redemption)
  const earnedEstimate = loyaltyAgent.calculateEarnedPoints(loyalty.totalAfterPoints);

  res.status(200).json({
    success: true,
    promotions: promo,
    loyalty,
    earnedPointsEstimate: earnedEstimate
  });
});

/**
 * POST /api/v1/loyalty/finalize
 * Called AFTER payment succeeded and order is created.
 * Body: { orderId, pointsUsed }
 *
 * This atomically deducts pointsUsed and awards earned points based on order total.
 */
exports.finalizeLoyalty = catchAsyncError(async (req, res, next) => {
  const { orderId, pointsUsed = 0 } = req.body;
  if (!orderId) return res.status(400).json({ success: false, message: 'orderId required' });

  try {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new Error('Order not found');

    // compute earned points from order total (we assume order.totalPrice exists and is final payable)
    const earnedPoints = loyaltyAgent.calculateEarnedPoints(order.totalPrice);

    // update user
    const user = await User.findById(order.user);
    if (!user) throw new Error('User not found for order');

    // Deduct used points safely
    const toDeduct = Math.min(pointsUsed, user.loyaltyPoints || 0);
    if (toDeduct > 0) {
      user.loyaltyPoints = (user.loyaltyPoints || 0) - toDeduct;
      user.loyaltyHistory.push({
        type: 'redeem',
        points: -toDeduct,
        orderId: order._id,
        note: `Redeemed for order ${order._id}`
      });
    }

    // Add earned points
    if (earnedPoints > 0) {
      user.loyaltyPoints = (user.loyaltyPoints || 0) + earnedPoints;
      user.loyaltyHistory.push({
        type: 'earn',
        points: earnedPoints,
        orderId: order._id,
        note: `Earned for order ${order._id}`
      });
    }

    await user.save();

    // Optionally: mark order with loyalty details
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        'loyalty.appliedPoints': toDeduct,
        'loyalty.earnedPoints': earnedPoints
      }
    });

    res.status(200).json({ success: true, deducted: toDeduct, earned: earnedPoints, newBalance: user.loyaltyPoints });
  } catch (err) {
    return next(err);
  }
});