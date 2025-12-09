// serviceAgent.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---- MODEL CONFIG WITH JSON MODE ----
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    // Force the model to return ONLY JSON
    responseMimeType: "application/json",
    // Optional but recommended: define expected shape
    // so responses are more consistent.
    responseSchema: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          description: "Which agent should handle the request."
        },
        parameters: {
          type: "object",
          description: "Extracted parameters like query, sku, category.",
          properties: {
            query: { type: "string", nullable: true },
            sku: { type: "string", nullable: true },
            category: { type: "string", nullable: true },
            product: { type: "string", nullable: true }
          },
          additionalProperties: true
        },
        reply: {
          type: "string",
          description: "Natural language reply (for GENERAL_CHAT or sales pitch).",
          nullable: true
        }
      },
      required: ["intent"],
      additionalProperties: true
    }
  }
});

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
      // 1. DECIDE INTENT WITH GEMINI (JSON RESPONSE)
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

        You MUST respond ONLY with a JSON object matching this TypeScript type:
        {
          intent: "RECOMMENDATION_AGENT" | "INVENTORY_AGENT" | "LOYALTY_AGENT" | "FULFILLMENT_AGENT" | "GENERAL_CHAT",
          parameters: {
            query?: string;
            sku?: string;
            category?: string;
            product?: string;
          },
          reply?: string
        }

        Do NOT include explanations, Markdown, or backticks. Only return the JSON.
      `;

      // For @google/generative-ai, you can still pass a plain string prompt:
      const result = await model.generateContent(prompt);

      // Because we forced responseMimeType=application/json,
      // this should now be a clean JSON string.
      const aiResponseText = result.response.text();

      let parsedIntent;
      try {
        parsedIntent = JSON.parse(aiResponseText);

        // Ensure parameters object exists
        if (!parsedIntent.parameters || typeof parsedIntent.parameters !== "object") {
          parsedIntent.parameters = {};
        }
      } catch (e) {
        console.error("Failed to parse Gemini JSON:", aiResponseText);
        return {
          reply:
            "I'm having a bit of trouble understanding right now. Could you say that again in a slightly different way?"
        };
      }

      console.log("Parsed Intent:", parsedIntent);

      // 2. ROUTE TO APPROPRIATE AGENT
      let agentResponse = {};
      let finalReply = "";

      switch (parsedIntent.intent) {
        case "RECOMMENDATION_AGENT": {
          const products = recommendationAgent.getRecommendations(
            parsedIntent.parameters.query || message,
            mockUserHistory
          );
          agentResponse = { products };

          if (products && products.length > 0) {
            const productNames = products.map((p) => p.name).join(", ");
            finalReply = `${
              parsedIntent.reply || "Check these out!"
            } I found some great items for you: ${productNames}. Would you like to know more about any of them?`;
          } else {
            finalReply =
              "I couldn't find any products matching that description, but I'm sure we have something you'll love. Can you tell me more about what you're looking for?";
          }
          break;
        }

        case "INVENTORY_AGENT": {
          const query =
            parsedIntent.parameters.sku ||
            parsedIntent.parameters.query ||
            parsedIntent.parameters.product;

          if (query) {
            const stockInfo = await inventoryAgent.checkInventory(query);
            agentResponse = { stockInfo };
            finalReply = stockInfo.message;
          } else {
            finalReply = "Which product are you interested in checking the stock for?";
          }
          break;
        }

        case "LOYALTY_AGENT": {
          if (parsedIntent.parameters.query) {
            // Mock a product for calculation if they mentioned one
            const mockProduct = {
              price: 1000,
              name: parsedIntent.parameters.query
            };
            const offer = loyaltyAgent.applyLoyaltyAndOffers(
              mockUserHistory,
              mockProduct,
              null
            );
            finalReply = `Good news! As a ${mockUserHistory.tier} member, you can get a discount. ${
              offer.message || "Special pricing available!"
            }`;
          } else {
            finalReply = `You are currently a ${mockUserHistory.tier} member with ${mockUserHistory.loyaltyPoints} points. You can redeem these for discounts on your next purchase!`;
          }
          break;
        }

        case "FULFILLMENT_AGENT": {
          const deliveryInfo = fulfillmentAgent.scheduleDelivery({
            orderId: "Current Session"
          });
          finalReply = `We can get that to you quickly! ${deliveryInfo.message}`;
          break;
        }

        case "GENERAL_CHAT":
        default: {
          // Use the reply generated in the first step if available
          finalReply =
            parsedIntent.reply ||
            "I'm here to help with any questions you have about our products!";
          break;
        }
      }

      return {
        reply: finalReply,
        data: agentResponse, // Return raw data if frontend needs to render cards/UI
        intent: parsedIntent.intent
      };
    } catch (error) {
      console.error(
        "Service Agent Error Full Object:",
        JSON.stringify(error, null, 2)
      );
      console.error("Service Agent Error Message:", error.message);

      // Fallback for Rate Limits (429) or any Gemini error
      if (
        error.status === 429 ||
        (error.message && error.message.includes("429")) ||
        (error.message && error.message.toLowerCase().includes("quota"))
      ) {
        console.log("ENTERING FALLBACK MODE due to 429/Quota error");
        // Simple keyword matching fallback
        const lowerMsg = message.toLowerCase();
        if (
          lowerMsg.includes("laptop") ||
          lowerMsg.includes("phone") ||
          lowerMsg.includes("buy") ||
          lowerMsg.includes("show") ||
          lowerMsg.includes("recommend")
        ) {
          const products = recommendationAgent.getRecommendations(
            message,
            mockUserHistory
          );
          return {
            reply:
              "I'm currently experiencing high traffic on my AI brain, but I found these products for you from our catalog:",
            data: { products },
            intent: "RECOMMENDATION_AGENT"
          };
        }
        return {
          reply:
            "I'm currently experiencing very high traffic. Please try again in about a minute."
        };
      }

      return {
        reply:
          "I'm currently experiencing high traffic. Please try again in a moment."
      };
    }
  }
};
