const User = require("../models/userModel");

module.exports = {
  getDiscount: async (userId) => {
    if (!userId) return 0;
    
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      // Simple logic: 1 point = 1% discount, max 10%
      // Or based on tier
      let discount = 0;
      if (user.loyaltyPoints) {
        discount = Math.min(user.loyaltyPoints / 10, 10); // Example logic
      }
      
      return Math.round(discount);
    } catch (error) {
      console.error("Loyalty check error:", error);
      return 0;
    }
  },

  applyLoyaltyAndOffers: async (userId, product, couponCode) => {
    const user = await User.findById(userId);

    if (!user) {
      return { error: "User not found" };
    }

    let originalPrice = product.price;
    let finalPrice = originalPrice;
    let savings = 0;

    // 1️⃣ Loyalty Points Discount (max 10% of price)
    let loyaltyDiscount = 0;
    if (user.loyaltyPoints) {
        loyaltyDiscount = Math.min(user.loyaltyPoints, originalPrice * 0.10);
        finalPrice -= loyaltyDiscount;
        savings += loyaltyDiscount;
    }

    // 2️⃣ Tier-Based Discounts
    let tierDiscount = 0;
    if (user.tier === "GOLD") tierDiscount = originalPrice * 0.05;
    if (user.tier === "PLATINUM") tierDiscount = originalPrice * 0.10;

    finalPrice -= tierDiscount;
    savings += tierDiscount;

    // 3️⃣ Coupon Codes from DB
    let couponDiscount = 0;

    if (couponCode) {
      const validCoupons = {
        NEW100: 100,
        SAVE10: originalPrice * 0.10,
        FLAT50: 50
      };

      if (validCoupons[couponCode]) {
        couponDiscount = validCoupons[couponCode];
        finalPrice -= couponDiscount;
        savings += couponDiscount;
      }
    }

    // 4️⃣ Update User Loyalty Points (earn + spend)
    const earnedPoints = Math.floor(finalPrice * 0.05); // user earns 5% back
    user.loyaltyPoints = (user.loyaltyPoints || 0) - loyaltyDiscount + earnedPoints;
    await user.save();

    return {
      originalPrice,
      finalPrice: Math.max(finalPrice, 0),
      savings,
      applied: {
        loyaltyDiscount,
        tierDiscount,
        couponDiscount
      },
      earnedPoints,
      updatedLoyalty: user.loyaltyPoints
    };
  },

  calculatePoints: async (userId, orderTotal) => {
    try {
      // Example: 1 point for every $10 spent
      const pointsEarned = Math.floor(orderTotal / 10);
      return pointsEarned;
    } catch (error) {
      console.error("Loyalty Agent Error:", error);
      return 0;
    }
  }
};
