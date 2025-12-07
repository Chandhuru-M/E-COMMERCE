// backend/agents/loyaltyAgent.js

module.exports = {
  applyLoyaltyAndOffers: (user, product, couponCode) => {
    
    let originalPrice = product.price;
    let finalPrice = originalPrice;
    let savings = 0;

    // ------------------------------
    // 1. Apply LOYALTY POINTS
    // ------------------------------
    let loyaltyDiscount = 0;

    if (user.loyaltyPoints && user.loyaltyPoints > 0) {
      // 1 point = ₹1 discount (Example rule)
      loyaltyDiscount = Math.min(user.loyaltyPoints, originalPrice * 0.10); 
      finalPrice -= loyaltyDiscount;
      savings += loyaltyDiscount;
    }

    // ------------------------------
    // 2. Apply TIER DISCOUNT
    // ------------------------------
    let tierDiscount = 0;

    if (user.tier === "GOLD") {
      tierDiscount = originalPrice * 0.05; // 5%
    } 
    else if (user.tier === "PLATINUM") {
      tierDiscount = originalPrice * 0.10; // 10%
    }

    finalPrice -= tierDiscount;
    savings += tierDiscount;

    // ------------------------------
    // 3. Apply COUPON CODE (if any)
    // ------------------------------
    let couponDiscount = 0;

    if (couponCode) {
      const coupons = {
        FLAT50: 50,
        SAVE10: product.price * 0.10,
        NEWUSER: 100
      };

      if (coupons[couponCode]) {
        couponDiscount = coupons[couponCode];
        finalPrice -= couponDiscount;
        savings += couponDiscount;
      }
    }

    // ------------------------------
    // 4. Prevent negative price
    // ------------------------------
    if (finalPrice < 0) finalPrice = 0;

    return {
      originalPrice,
      finalPrice,
      savings,
      applied: {
        loyaltyDiscount,
        tierDiscount,
        couponDiscount
      },
      message: `Final price after discounts: ₹${finalPrice}`
    };
  }
};
