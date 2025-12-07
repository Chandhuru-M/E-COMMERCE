const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = {
  processPayment: async (amount, currency, user, orderDetails) => {
    try {
      const convertedAmount = Math.round(amount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: convertedAmount,
        currency: currency || "inr",
        metadata: {
          userId: user?._id || user?.id || "guest",
          email: user?.email || "",
          orderId: orderDetails.orderId,
          productName: orderDetails.productName
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Payment initialization failed",
        error: error.message
      };
    }
  }
};
