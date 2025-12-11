const fulfillmentAgent = require("../agents/fulfillmentAgent");

/**
 * Schedule fulfillment after payment
 */
exports.scheduleFulfillment = async ({ orderId }) => {
  try {
    return await fulfillmentAgent.scheduleDelivery(orderId);
  } catch (error) {
    return { success: false, message: error.message };
  }
};
