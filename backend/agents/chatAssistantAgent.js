// agents/chatAssistantAgent.js
const ProductService = require("../services/productService");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { tools, executeTool } = require("./toolDefinitions");
const Config = require("../models/configModel");

// Helper to get the model instance dynamically
async function getGeminiModel() {
  let apiKey = process.env.GEMINI_API_KEY;
  
  try {
    const config = await Config.findOne().select('+geminiApiKey');
    if (config && config.geminiApiKey) {
      apiKey = config.geminiApiKey;
    }
  } catch (error) {
    console.error("Error fetching Gemini API key from DB, using env var:", error);
  }

  if (!apiKey) {
    throw new Error("Gemini API Key is missing in both DB and Environment Variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: "gemini-flash-latest", 
    tools: tools 
  });
}

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
      const lower = userMessage.toLowerCase();

      // Quick keyword-based support flow: offer to create a support ticket
      const supportKeywords = ['support', 'complaint', 'issue', 'problem', 'help', 'raise a ticket', 'report'];
      const isSupport = supportKeywords.some(k => lower.includes(k));

      if (isSupport && !session.pendingTicket) {
        // Save pending description and ask for confirmation
        session.pendingTicket = { description: userMessage };
        return {
          success: true,
          reply: "I can create a support ticket for you based on your message. Reply 'yes' to create the ticket or 'no' to cancel.",
          session
        };
      }

      // If user confirms and we have a pending ticket, create it
      if (session.pendingTicket && ['yes', 'y'].includes(lower.trim())) {
        // Build subject from first 60 characters
        const subject = (session.pendingTicket.subject || userMessage.split('\n')[0] || userMessage).slice(0, 60);
        const description = session.pendingTicket.description || userMessage;

        // Call tool to create ticket
        const ticketResult = await executeTool('create_support_ticket', { subject, description }, session);

        // clear pending
        delete session.pendingTicket;

        if (ticketResult && ticketResult.success) {
          const ticketId = ticketResult.ticket.ticketId || ticketResult.ticket._id || 'N/A';
          return { success: true, reply: `Your support ticket has been created (ID: ${ticketId}). Our team will contact you shortly.`, session };
        }

        return { success: false, reply: 'Sorry, I could not create a ticket right now. Please try again later.', session };
      }
      
      // Get Model Dynamically
      const model = await getGeminiModel();

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

