// agents/salesAgent.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Import existing agents
const recommendAgent = require("./recommendAgent");
const inventoryAgent = require("./inventoryAgent");
const loyaltyAgent = require("./loyaltyAgent");

module.exports = {
  async handleUserMessage(message, session) {
    try {
      // Create prompt for Gemini
      const prompt = `
You are an AI SALES AGENT for an e-commerce website.
You can perform these actions:
1. Recommend products
2. Check inventory
3. Apply loyalty discounts
4. Add items to cart
5. Answer product questions

User message: "${message}"

Your job: Understand the user's intent and return a JSON response:
{
  "intent": "",
  "query": "",
  "product": "",
  "price_limit": "",
  "action": ""
}
`;

      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      // Parse JSON from Gemini
      let parsed;
      try {
        parsed = JSON.parse(aiResponse);
      } catch {
        return { reply: "Sorry, I couldn't understand. Please try asking differently." };
      }

      const intent = parsed.intent;
      const query = parsed.query;
      const product = parsed.product;
      const priceLimit = parsed.price_limit;

      // Perform actions based on intent
      if (intent === "recommend") {
        const rec = await recommendAgent.getRecommendations(query, session.user?._id);
        return { reply: rec };
      }

      if (intent === "inventory_check") {
        const stock = await inventoryAgent.checkInventory(product);
        return { reply: stock };
      }

      if (intent === "apply_loyalty") {
        const discount = await loyaltyAgent.getDiscount(session.user?._id);
        return { reply: `Your discount is ${discount}%` };
      }

      if (intent === "add_to_cart") {
        session.cart.push({ product });
        return { reply: `${product} added to cart.` };
      }

      return { reply: "I can help you shop! Ask me for products or deals." };

    } catch (error) {
      console.log(error);
      return { reply: "Error occurred in sales agent." };
    }
  }
};
