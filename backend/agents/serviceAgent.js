// serviceAgent.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/productModel");
const Order = require("../models/orderModel"); // Import Order model

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
          }
        },
        reply: {
          type: "string",
          description: "Natural language reply (for GENERAL_CHAT or sales pitch).",
          nullable: true
        }
      },
      required: ["intent"]
    }
  }
});

// Import other agents
const recommendationAgent = require("./recommendationAgent");
const inventoryAgent = require("./inventoryAgent");
const loyaltyAgent = require("./loyaltyAgent");
const fulfillmentAgent = require("./fulfillmentAgent");
const paymentAgent = require("./paymentAgent");

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
        - PAYMENT_AGENT: Use this when the user explicitly says they want to "buy", "purchase", or "checkout" a specific product.
        - GENERAL_CHAT: Use this for greetings, small talk, or questions not covered above.

        User Message: "${message}"

        You MUST respond ONLY with a JSON object matching this TypeScript type:
        {
          intent: "RECOMMENDATION_AGENT" | "INVENTORY_AGENT" | "LOYALTY_AGENT" | "FULFILLMENT_AGENT" | "PAYMENT_AGENT" | "GENERAL_CHAT",
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
        case "RECOMMENDATION_AGENT":
          const products = await recommendationAgent.getRecommendations(parsedIntent.parameters.query || message, mockUserHistory);
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

        case "LOYALTY_AGENT":
          // We need a product to apply offers to, but if it's general, we just explain the program.
          if (parsedIntent.parameters.query) {
             // Try to find the real product
             const regex = new RegExp(parsedIntent.parameters.query, 'i');
             let productToUse = null;
             try {
                const realProduct = await Product.findOne({ name: regex });
                if (realProduct) productToUse = realProduct.toObject();
             } catch (e) { console.error("Loyalty product lookup failed", e); }

             // Fallback if not found
             if (!productToUse) {
                productToUse = { price: 1000, name: parsedIntent.parameters.query };
             }

             if (userContext && userContext._id) {
                 const offer = await loyaltyAgent.applyLoyaltyAndOffers(userContext._id, productToUse, null);
                 agentResponse = { offer };
                 finalReply = `Good news! As a loyal member, you can get a discount on ${productToUse.name}. ${offer.message || "Special pricing available!"}`;
             } else {
                 finalReply = "Please log in to check your loyalty points and exclusive offers.";
             }
          } else {
             if (userContext && userContext._id) {
                 // Just check points
                 // We might need a specific method for this in loyaltyAgent, or just use applyLoyaltyAndOffers with a dummy product
                 const dummyProduct = { price: 0, name: "Check" };
                 const offer = await loyaltyAgent.applyLoyaltyAndOffers(userContext._id, dummyProduct, null);
                 finalReply = `You currently have ${offer.updatedLoyalty || 0} loyalty points.`;
             } else {
                 finalReply = "Our loyalty program offers great rewards! Log in to see your status.";
             }
          }
          break;

        case "FULFILLMENT_AGENT":
          if (userContext && userContext._id) {
              // Find the last order for this user
              const lastOrder = await Order.findOne({ user: userContext._id }).sort({ createdAt: -1 });
              
              if (lastOrder) {
                  const deliveryInfo = await fulfillmentAgent.scheduleDelivery(lastOrder._id);
                  agentResponse = { deliveryInfo };
                  finalReply = `Regarding your order #${lastOrder._id}: ${deliveryInfo.message}`;
              } else {
                  finalReply = "I couldn't find any recent orders for your account.";
              }
          } else {
              finalReply = "Please log in so I can check your order status.";
          }
          break;

        case "PAYMENT_AGENT":
          if (parsedIntent.parameters.product || parsedIntent.parameters.query) {
             const productName = parsedIntent.parameters.product || parsedIntent.parameters.query;
             // Try to find the product to get price
             const regex = new RegExp(productName, 'i');
             const productToBuy = await Product.findOne({ name: regex });
             
             if (productToBuy) {
                 // Initiate payment logic (mock or real)
                 // We pass a dummy amount if we don't have a cart context, or use product price
                 const paymentResult = await paymentAgent.processPayment(productToBuy.price, "usd", userContext, { orderId: "TEMP", productName: productToBuy.name });
                 
                 if (paymentResult.success) {
                     agentResponse = { payment: paymentResult };
                     finalReply = `Great choice! I've prepared the secure checkout for ${productToBuy.name} (Price: $${productToBuy.price}). You can proceed with the payment.`;
                 } else {
                     finalReply = "I encountered an issue setting up the payment. Please try adding it to your cart manually.";
                 }
             } else {
                 finalReply = "I couldn't find that specific product to checkout. Could you confirm the name?";
             }
          } else {
              finalReply = "What product would you like to buy?";
          }
          break;

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
      console.error("Service Agent Error Full Object:", JSON.stringify(error, null, 2));
      console.error("Service Agent Error Message:", error.message);

      // ALWAYS ENTER FALLBACK MODE on error (429, 500, Network, etc.)
      console.log("ENTERING FALLBACK MODE due to error");
         
      // Simple keyword matching fallback
      const lowerMsg = message.toLowerCase();
      let fallbackQuery = message;

      
      // Extract better search terms
      if (lowerMsg.includes("laptop")) fallbackQuery = "laptop";
      else if (lowerMsg.includes("phone") || lowerMsg.includes("mobile")) fallbackQuery = "phone";
      else if (lowerMsg.includes("headphone")) fallbackQuery = "headphone";
      else if (lowerMsg.includes("watch")) fallbackQuery = "watch";
      else if (lowerMsg.includes("camera")) fallbackQuery = "camera";
      else {
        // Remove common stop words to get a cleaner query
        fallbackQuery = lowerMsg.replace(/show|me|buy|recommend|i|want|looking|for|a|an|the|please|hi|hello|hey/g, "").trim();
      }

      // If query is empty (e.g. just "hi"), give a generic welcome
      if (fallbackQuery.length === 0) {
          return { reply: "Hello! I'm currently operating in offline mode due to high traffic. I can still help you find products. Try searching for 'laptops', 'phones', or specific items!" };
      }

      if (fallbackQuery.length > 0) {
          try {
            const products = await recommendationAgent.getRecommendations(fallbackQuery, mockUserHistory);
            if (products && products.length > 0) {
                return {
                    reply: "I'm currently experiencing high traffic on my AI brain, but I found these products for you from our catalog:",
                    data: { products },
                    intent: "RECOMMENDATION_AGENT"
                };
            } else {
                return { reply: `I'm currently offline and couldn't find any products matching "${fallbackQuery}" in our catalog. Please try a different search term.` };
            }
          } catch (dbError) {
              console.error("Fallback DB Error:", dbError);
          }
      }
      
      return { reply: "I'm currently experiencing high traffic. Please try again in a moment." };
    }
  }
};
