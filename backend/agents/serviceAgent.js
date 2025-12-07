const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Import other agents
const recommendationAgent = require("./recommendationAgent");
const inventoryAgent = require("./inventoryAgent");
const loyaltyAgent = require("./loyaltyAgent");
const fulfillmentAgent = require("./fulfillmentAgent");

// Mock user history for now (in a real app, fetch from DB)
const mockUserHistory = {
  favCategories: ["electronics", "clothing"],
  favColors: ["black", "blue"],
  loyaltyPoints: 150,
  tier: "GOLD"
};

module.exports = {
  async handleRequest(message, userContext = {}) {
    try {
      // 1. DECIDE INTENT WITH GEMINI
      const prompt = `
        You are the "Master Service Agent" for JvlCart, an e-commerce platform.
        Your goal is to act as a helpful, persuasive, and knowledgeable salesman.
        
        You have access to the following "Sub-Agents" (tools):
        - RECOMMENDATION_AGENT: Use this when the user asks for product suggestions, searches for items, or asks "what should I buy?".
        - INVENTORY_AGENT: Use this when the user asks about stock availability of a specific product (SKU or name).
        - LOYALTY_AGENT: Use this when the user asks about discounts, loyalty points, or offers.
        - FULFILLMENT_AGENT: Use this when the user asks about shipping, delivery times, or order tracking.
        - GENERAL_CHAT: Use this for greetings, small talk, or questions not covered above.

        User Message: "${message}"

        Analyze the user's message and return a JSON object with the following structure:
        {
          "intent": "RECOMMENDATION_AGENT" | "INVENTORY_AGENT" | "LOYALTY_AGENT" | "FULFILLMENT_AGENT" | "GENERAL_CHAT",
          "parameters": {
            "query": "extracted search query or product name",
            "sku": "extracted sku if available",
            "category": "extracted category if available"
          },
          "reply": "If the intent is GENERAL_CHAT, write the conversational response here. If the intent is RECOMMENDATION_AGENT, write a persuasive sales pitch here. For others, leave empty or provide a brief transition."
        }
      `;

      const result = await model.generateContent(prompt);
      const aiResponseText = result.response.text();
      
      // Clean up json string if it has markdown formatting
      const cleanJson = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      let parsedIntent;
      try {
        parsedIntent = JSON.parse(cleanJson);
        // Ensure parameters object exists
        if (!parsedIntent.parameters) parsedIntent.parameters = {};
      } catch (e) {
        console.error("Failed to parse Gemini response:", aiResponseText);
        return { reply: "I'm having a bit of trouble understanding right now. Could you say that again?" };
      }

      console.log("Parsed Intent:", parsedIntent);

      // 2. ROUTE TO APPROPRIATE AGENT
      let agentResponse = {};
      let finalReply = "";

      switch (parsedIntent.intent) {
        case "RECOMMENDATION_AGENT":
          const products = recommendationAgent.getRecommendations(parsedIntent.parameters.query || message, mockUserHistory);
          agentResponse = { products };
          
          if (products.length > 0) {
            const productNames = products.map(p => p.name).join(", ");
            finalReply = `${parsedIntent.reply || "Check these out!"} I found some great items for you: ${productNames}. Would you like to know more about any of them?`;
          } else {
            finalReply = "I couldn't find any products matching that description, but I'm sure we have something you'll love. Can you tell me more about what you're looking for?";
          }
          break;

        case "INVENTORY_AGENT":
          // If we have a SKU or product name, check it. 
          // Note: inventoryAgent.checkInventory expects a SKU, but the mock implementation also searches by name in fallback.
          const query = parsedIntent.parameters.sku || parsedIntent.parameters.query || parsedIntent.parameters.product;
          if (query) {
            const stockInfo = await inventoryAgent.checkInventory(query);
            agentResponse = { stockInfo };
            finalReply = stockInfo.message;
          } else {
            finalReply = "Which product are you interested in checking the stock for?";
          }
          break;

        case "LOYALTY_AGENT":
          // We need a product to apply offers to, but if it's general, we just explain the program.
          // For now, let's just give a general loyalty message or simulate a check on a dummy product if they asked about a specific one.
          if (parsedIntent.parameters.query) {
             // Mock a product for calculation if they mentioned one
             const mockProduct = { price: 1000, name: parsedIntent.parameters.query }; 
             const offer = loyaltyAgent.applyLoyaltyAndOffers(mockUserHistory, mockProduct, null);
             finalReply = `Good news! As a ${mockUserHistory.tier} member, you can get a discount. ${offer.message || "Special pricing available!"}`;
          } else {
             finalReply = `You are currently a ${mockUserHistory.tier} member with ${mockUserHistory.loyaltyPoints} points. You can redeem these for discounts on your next purchase!`;
          }
          break;

        case "FULFILLMENT_AGENT":
          // Mock an order for delivery estimation
          const deliveryInfo = fulfillmentAgent.scheduleDelivery({ orderId: "Current Session" });
          finalReply = `We can get that to you quickly! ${deliveryInfo.message}`;
          break;

        case "GENERAL_CHAT":
        default:
          // Use the reply generated in the first step
          finalReply = parsedIntent.reply || "I'm here to help with any questions you have about our products!";
          break;
      }

      return {
        reply: finalReply,
        data: agentResponse, // Return raw data if frontend needs to render cards/UI
        intent: parsedIntent.intent
      };

    } catch (error) {
      console.error("Service Agent Error Full Object:", JSON.stringify(error, null, 2));
      console.error("Service Agent Error Message:", error.message);
      
      // Fallback for Rate Limits (429) or any Gemini error
      if (error.status === 429 || (error.message && error.message.includes("429")) || (error.message && error.message.includes("quota"))) {
         console.log("ENTERING FALLBACK MODE due to 429/Quota error");
         // Simple keyword matching fallback
         const lowerMsg = message.toLowerCase();
         if (lowerMsg.includes("laptop") || lowerMsg.includes("phone") || lowerMsg.includes("buy") || lowerMsg.includes("show") || lowerMsg.includes("recommend")) {
             const products = recommendationAgent.getRecommendations(message, mockUserHistory);
             return {
                 reply: "I'm currently experiencing high traffic on my AI brain, but I found these products for you from our catalog:",
                 data: { products },
                 intent: "RECOMMENDATION_AGENT"
             };
         }
         return { reply: "I'm currently experiencing very high traffic. Please try again in about a minute." };
      }

      return { reply: "I'm currently experiencing high traffic. Please try again in a moment." };
    }
  }
};
