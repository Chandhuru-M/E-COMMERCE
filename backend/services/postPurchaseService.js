const postPurchaseAgent = require("../agents/postPurchaseAgent");

/**
 * Trigger post-purchase flow after payment
 */
exports.createAfterPayment = async (orderId) => {
  try {
    return await postPurchaseAgent.trigger(orderId);
  } catch (error) {
    return { success: false, message: error.message };
  }
};
