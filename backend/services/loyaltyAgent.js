// backend/services/loyaltyAgent.js
const Product = require('../models/productModel');

/**
 * Calculate product discounts (mock or real)
 * You can replace this with a real promo rules service.
 * Expects cartItems: [{ productId, price, quantity }]
 */
async function calculatePromotions(cartItems) {
  // For demo: check product-level discount field if present (product.discountPercent)
  const items = await Promise.all(cartItems.map(async item => {
    const product = await Product.findById(item.productId).lean();
    const basePrice = product ? product.price : item.price;
    const discountPercent = product?.discountPercent || 0; // assume 0 if not present
    const discountAmount = +(basePrice * (discountPercent / 100)).toFixed(2);
    const unitFinalPrice = +(basePrice - discountAmount).toFixed(2);
    return {
      productId: item.productId,
      name: product?.name || item.name,
      qty: item.quantity || 1,
      basePrice,
      discountPercent,
      unitFinalPrice,
      lineTotal: +(unitFinalPrice * (item.quantity || 1)).toFixed(2),
      discountAmountPerUnit: discountAmount
    };
  }));

  // totals
  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
  return { items, subtotal };
}

/**
 * Determine loyalty redemption suggestion and compute totals.
 * - userPoints: user's current points (integer)
 * - subtotal: total after promotions
 * - shipping/tax passed in caller
 *
 * Returns object: { pointsSuggested, pointsValue, totalPayable, details }
 */
function computeLoyaltyAndTotals({ userPoints = 0, subtotal = 0, shipping = 0, tax = 0, maxPointsToUse = null }) {
  // redemption conversion
  const pointValue = 1; // 1 point = ₹1

  // By default, user can use up to subtotal (can't exceed payable)
  const maxUsable = Math.min(userPoints, Math.floor(subtotal)); // integer rupees only

  // If caller specifies maxPointsToUse, respect that (user choice)
  const pointsSuggested = maxPointsToUse !== null ? Math.min(maxUsable, maxPointsToUse) : maxUsable;

  const pointsValue = pointsSuggested * pointValue;
  const totalAfterPoints = Math.max(0, +(subtotal - pointsValue).toFixed(2));

  const totalPayable = +(totalAfterPoints + shipping + tax).toFixed(2);

  return {
    pointsSuggested,
    pointsValue,
    totalAfterPoints,
    totalPayable
  };
}

/**
 * Earn points calculation
 * earnedPoints = floor(totalAfterDiscounts / 10)
 */
function calculateEarnedPoints(totalPayable) {
  return Math.floor(totalPayable / 10);
}

module.exports = {
  calculatePromotions,
  computeLoyaltyAndTotals,
  calculateEarnedPoints
};