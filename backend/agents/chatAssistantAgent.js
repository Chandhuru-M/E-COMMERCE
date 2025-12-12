// agents/chatAssistantAgent.js
const ProductService = require("../services/productService");

module.exports = {
  /**
   * Handle user message - supports both text and barcode scan events
   * @param {string|object} message - Text message or barcode scan event object
   * @param {object} session - User session data
   * @returns {object} Response with reply and optional product data
   */
  async handleUserMessage(message, session = {}) {
    try {
      // 1. Check if this is a BARCODE scan event
      if (message && typeof message === "object" && message.type === "barcode_scan") {
        const scannedCode = message.data; // e.g. "PRD1023"

        const product = await ProductService.findByBarcode(scannedCode);

        if (!product) {
          return {
            success: true,
            reply: `I could not find a product for barcode: ${scannedCode}`,
            product: null,
            session
          };
        }

        return {
          success: true,
          reply: `Here is what I found for barcode ${scannedCode}:`,
          product: ProductService.toPublic(product),
          session
        };
      }

      // 2. Normal text-based message
      const intent = await this.detectIntent(message);
      const response = await this.routeIntent(intent, session);

      return response;
    } catch (error) {
      console.error("ChatAssistant error:", error);
      return {
        success: false,
        reply: "Sorry, I encountered an error processing your request.",
        session
      };
    }
  },

  /**
   * Detect user intent from message
   * @param {string} message - User message
   * @returns {object} Intent object
   */
  async detectIntent(message) {
    const lowerMessage = typeof message === "string" ? message.toLowerCase() : "";

    // Simple intent detection (can be enhanced with NLU)
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return { type: "greeting" };
    } else if (lowerMessage.includes("order")) {
      return { type: "order_inquiry" };
    } else if (lowerMessage.includes("payment") || lowerMessage.includes("pay")) {
      return { type: "payment_inquiry" };
    } else if (lowerMessage.includes("shipping") || lowerMessage.includes("delivery")) {
      return { type: "shipping_inquiry" };
    } else if (lowerMessage.includes("return") || lowerMessage.includes("refund")) {
      return { type: "return_inquiry" };
    } else if (lowerMessage.includes("contact") || lowerMessage.includes("support")) {
      return { type: "support_inquiry" };
    }

    return { type: "unknown", message };
  },

  /**
   * Route intent to appropriate handler
   * @param {object} intent - Detected intent
   * @param {object} session - User session
   * @returns {object} Response
   */
  async routeIntent(intent, session) {
    let reply = "I'm sorry, I didn't understand that. Can you please rephrase?";

    switch (intent.type) {
      case "greeting":
        reply = "Hello! Welcome to AURA. How can I help you today?";
        break;
      case "order_inquiry":
        reply = "You can check your orders in the 'My Orders' section under your profile.";
        break;
      case "payment_inquiry":
        reply = "We accept Visa, MasterCard, and Stripe payments. All transactions are secure.";
        break;
      case "shipping_inquiry":
        reply = "We ship worldwide! Delivery usually takes 3-5 business days.";
        break;
      case "return_inquiry":
        reply = "You can return products within 7 days of delivery if they are unused.";
        break;
      case "support_inquiry":
        reply = "You can reach our support team at support@aura.com.";
        break;
    }

    return {
      success: true,
      reply,
      session
    };
  }
};
