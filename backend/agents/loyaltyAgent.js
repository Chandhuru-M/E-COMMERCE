// // backend/agents/loyaltyAgent.js

// module.exports = {
//   applyLoyaltyAndOffers: (user, product, couponCode) => {
    
//     let originalPrice = product.price;
//     let finalPrice = originalPrice;
//     let savings = 0;

//     // ------------------------------
//     // 1. Apply LOYALTY POINTS
//     // ------------------------------
//     let loyaltyDiscount = 0;

//     if (user.loyaltyPoints && user.loyaltyPoints > 0) {
//       // 1 point = ₹1 discount (Example rule)
//       loyaltyDiscount = Math.min(user.loyaltyPoints, originalPrice * 0.10); 
//       finalPrice -= loyaltyDiscount;
//       savings += loyaltyDiscount;
//     }

//     // ------------------------------
//     // 2. Apply TIER DISCOUNT
//     // ------------------------------
//     let tierDiscount = 0;

//     if (user.tier === "GOLD") {
//       tierDiscount = originalPrice * 0.05; // 5%
//     } 
//     else if (user.tier === "PLATINUM") {
//       tierDiscount = originalPrice * 0.10; // 10%
//     }

//     finalPrice -= tierDiscount;
//     savings += tierDiscount;

//     // ------------------------------
//     // 3. Apply COUPON CODE (if any)
//     // ------------------------------
//     let couponDiscount = 0;

//     if (couponCode) {
//       const coupons = {
//         FLAT50: 50,
//         SAVE10: product.price * 0.10,
//         NEWUSER: 100
//       };

//       if (coupons[couponCode]) {
//         couponDiscount = coupons[couponCode];
//         finalPrice -= couponDiscount;
//         savings += couponDiscount;
//       }
//     }

//     // ------------------------------
//     // 4. Prevent negative price
//     // ------------------------------
//     if (finalPrice < 0) finalPrice = 0;

//     return {
//       originalPrice,
//       finalPrice,
//       savings,
//       applied: {
//         loyaltyDiscount,
//         tierDiscount,
//         couponDiscount
//       },
//       message: `Final price after discounts: ₹${finalPrice}`
//     };
//   }
// };
const User = require("../models/userModel"); 

module.exports = {
  applyLoyaltyAndOffers: async (userId, product, couponCode) => {
    const user = await User.findById(userId);

    if (!user) {
      return { error: "User not found" };
    }

    let originalPrice = product.price;
    let finalPrice = originalPrice;
    let savings = 0;

    // 1️⃣ Loyalty Points Discount (max 10% of price)
    let loyaltyDiscount = Math.min(user.loyaltyPoints, originalPrice * 0.10);
    finalPrice -= loyaltyDiscount;
    savings += loyaltyDiscount;

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
    user.loyaltyPoints = user.loyaltyPoints - loyaltyDiscount + earnedPoints;
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
  }
};

exports.calculatePoints = async (userId, orderTotal) => {
  try {
    // Example: 1 point for every $10 spent
    const pointsEarned = Math.floor(orderTotal / 10);
    
    // If you add a 'points' field to your User model later:
    // const user = await User.findById(userId);
    // user.points = (user.points || 0) + pointsEarned;
    // await user.save();

    return pointsEarned;
  } catch (error) {
    console.error("Loyalty Agent Error:", error);
    return 0;
  }
};
