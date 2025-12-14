// agents/chatAssistantAgent.js
const ProductService = require("../services/productService");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const salesAgent = require("./salesAgent");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
      const userMessage = typeof message === "string" ? message : "";
      
      // Use Gemini to decide which agent to use
      const routingPrompt = `
You are the Master Orchestrator for an e-commerce AI assistant.
User message: "${userMessage}"

Your goal is to route this message to the correct specialized agent.
Available Agents:
1. "sales": For product search, recommendations, checking stock, buying, loyalty points, adding to cart.
2. "support": For shipping info, return policy, contact support, general FAQs, greetings, order status/tracking.

Return ONLY a JSON object with this format:
{
  "agent": "sales" | "support",
  "reason": "brief reason"
}
`;

      const result = await model.generateContent(routingPrompt);
      const responseText = result.response.text();
      
      // Clean up markdown if present
      const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      let routingDecision;
      
      try {
        routingDecision = JSON.parse(jsonString);
      } catch (e) {
        console.error("Failed to parse routing decision:", responseText);
        // Fallback to support
        routingDecision = { agent: "support" };
      }

      console.log(`Routing decision: ${routingDecision.agent} (${routingDecision.reason})`);

      // Route to the chosen agent
      if (routingDecision.agent === "sales") {
        const salesResponse = await salesAgent.handleUserMessage(userMessage, session);
        return {
          success: true,
          ...salesResponse
        };
      } else {
        // Handle support/general queries directly with Gemini
        const supportPrompt = `
You are a helpful Customer Support Agent for an e-commerce store called AURA.
User message: "${userMessage}"

Provide a helpful, friendly, and concise response.
If they ask about orders, tell them to check 'My Orders'.
If they ask about shipping, say we ship worldwide in 3-5 days.
If they ask about returns, say we accept returns within 7 days.
If they say hello, welcome them.

Return ONLY the text response.
`;
        const supportResult = await model.generateContent(supportPrompt);
        const supportReply = supportResult.response.text();
        
        return {
          success: true,
          reply: supportReply,
          session
        };
      }

    } catch (error) {
      console.error("ChatAssistant error:", error);
      return {
        success: false,
        reply: "Sorry, I encountered an error processing your request.",
        session
      };
    }
  }
};

