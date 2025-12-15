// agents/chatAssistantAgent.js
const ProductService = require("../services/productService");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { tools, executeTool } = require("./toolDefinitions");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use a model that supports function calling well
const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest", // Updated to gemini-flash-latest as it is the supported model
  tools: tools 
});

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
      
      // Start a chat session
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "You are a helpful AI assistant for an e-commerce store called AURA. You can help with products, orders, and support. Always be friendly." }]
          },
          {
            role: "model",
            parts: [{ text: "Hello! I am AURA's AI assistant. How can I help you today?" }]
          }
        ],
      });

      // Send user message
      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      
      // Check for function calls
      const functionCalls = response.functionCalls();
      
      let finalReply = "";
      let productsFound = null;

      if (functionCalls && functionCalls.length > 0) {
        // Execute all requested functions
        const functionResponses = [];
        
        for (const call of functionCalls) {
          const functionName = call.name;
          const args = call.args;
          
          // Execute the tool
          const toolResult = await executeTool(functionName, args, session);
          
          // Capture products if search was performed (for UI display)
          if (functionName === "search_products" && Array.isArray(toolResult)) {
            productsFound = toolResult;
          }

          functionResponses.push({
            functionResponse: {
              name: functionName,
              response: { result: toolResult }
            }
          });
        }

        // Send tool results back to Gemini to generate final response
        const finalResult = await chat.sendMessage(functionResponses);
        finalReply = finalResult.response.text();
      } else {
        // No tools needed, just text response
        finalReply = response.text();
      }

      return {
        success: true,
        reply: finalReply,
        products: productsFound, // Pass products to frontend if found
        session
      };

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

