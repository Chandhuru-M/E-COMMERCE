const catchAsyncError = require("../middlewares/catchAsyncError");
const ProductService = require("../services/productService");

exports.chatAssistant = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;

  // 1. Check if this is a BARCODE scan event
  if (message && typeof message === "object" && message.type === "barcode_scan") {
    const scannedCode = message.data; // e.g. "PRD1023"

    const product = await ProductService.findByBarcode(scannedCode);

    if (!product) {
      return res.status(200).json({
        success: true,
        reply: `I could not find a product for barcode: ${scannedCode}`,
        product: null
      });
    }

    return res.status(200).json({
      success: true,
      reply: `Here is what I found for barcode ${scannedCode}:`,
      product: ProductService.toPublic(product)
    });
  }

  // 2. Normal text-based message
  const lowerMessage = message && typeof message === "string" ? message.toLowerCase() : "";
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
