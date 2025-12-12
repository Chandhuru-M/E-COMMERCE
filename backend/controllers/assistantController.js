const catchAsyncError = require("../middlewares/catchAsyncError");

exports.chatAssistant = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;
  const lowerMessage = message ? message.toLowerCase() : "";
  let reply = "I'm sorry, I didn't understand that. Can you please rephrase?";

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    reply = "Hello! Welcome to AURA. How can I help you today?";
  } else if (lowerMessage.includes("order")) {
    reply = "You can check your orders in the 'My Orders' section under your profile.";
  } else if (lowerMessage.includes("payment") || lowerMessage.includes("pay")) {
    reply = "We accept Visa, MasterCard, and Stripe payments. All transactions are secure.";
  } else if (lowerMessage.includes("shipping") || lowerMessage.includes("delivery")) {
    reply = "We ship worldwide! Delivery usually takes 3-5 business days.";
  } else if (lowerMessage.includes("return") || lowerMessage.includes("refund")) {
    reply = "You can return products within 7 days of delivery if they are unused.";
  } else if (lowerMessage.includes("contact") || lowerMessage.includes("support")) {
    reply = "You can reach our support team at support@aura.com.";
  }

  res.status(200).json({
    success: true,
    reply,
  });
});
