// agents/salesAgent.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Import existing agents
const recommendAgent = require("./recommendationAgent");
const inventoryAgent = require("./inventoryAgent");
const loyaltyAgent = require("./loyaltyAgent");

module.exports = {
  async handleUserMessage(message, session) {
    try {
      // Create prompt for Gemini
      const prompt = `
You are an AI SALES AGENT for an e-commerce website.
You can perform these actions:
1. Recommend products (use this for specific searches OR general greetings like "hi" to show trending items)
2. Check inventory
3. Apply loyalty discounts
4. Add items to cart
5. Answer product questions

User message: "${message}"

Your job: Understand the user's intent and return a JSON response:
{
  "intent": "recommend" | "inventory_check" | "apply_loyalty" | "add_to_cart" | "other",
  "query": "search term or empty for trending",
  "product": "product name if applicable",
  "price_limit": "number or null",
  "action": "action description"
}
`;

      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      // Clean up markdown if present (Gemini Flash often wraps JSON in ```json ... ```)
      const jsonString = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();

      // Parse JSON from Gemini
      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (e) {
        console.error("Failed to parse Sales Agent JSON:", aiResponse);
        return { reply: "I'm having a bit of trouble understanding. Could you rephrase that?" };
      }

      const intent = parsed.intent;
      const query = parsed.query;
      const product = parsed.product;
      const priceLimit = parsed.price_limit;

      let toolResult = "";
      let toolName = "";
      let productsFound = [];

      // Perform actions based on intent
      if (intent === "recommend") {
        toolName = "Product Recommendation";
        // If query is empty (e.g. just "hi"), pass a generic term or empty string to get trending
        const searchTerm = query || ""; 
        const recs = await recommendAgent.getRecommendations(searchTerm, session.user?._id);
        
        if (recs && recs.length > 0) {
          productsFound = recs;
          toolResult = recs.map(p => `- ${p.name} ($${p.price})`).join("\n");
        } else {
          toolResult = "No matching products found.";
        }
      } else if (intent === "inventory_check") {
        toolName = "Inventory Check";
        const stock = await inventoryAgent.checkInventory(product);
        toolResult = JSON.stringify(stock);
      } else if (intent === "apply_loyalty") {
        toolName = "Loyalty Program";
        const discount = await loyaltyAgent.getDiscount(session.user?._id);
        toolResult = `Discount available: ${discount}%`;
      } else if (intent === "add_to_cart") {
        toolName = "Cart Operation";
        session.cart.push({ product });
        toolResult = `Added ${product} to cart.`;
      } else {
        toolName = "General Chat";
        toolResult = "No specific tool action needed.";
      }

      // Final Step: Generate Natural Language Response
      const responsePrompt = `
You are a friendly and helpful AI Sales Assistant.
User Message: "${message}"
Action Taken: ${toolName}
Data Retrieved:
${toolResult}

Task: Write a natural, engaging response to the user using the retrieved data.
CRITICAL INSTRUCTION:
- If products were found (listed in Data Retrieved), the user will see them as visual cards in the chat.
- YOU MUST NOT list the products, prices, or details in your text response.
- YOU MUST NOT create a markdown table or bulleted list of items.
- Just say something like "I've found some great options for you!" or "Check out these top picks based on your request." and offer to help further.
- If checking stock or applying discounts, you CAN be specific.
`;

      const finalResult = await model.generateContent(responsePrompt);
      
      // Return both the text reply AND the structured product data
      return { 
        reply: finalResult.response.text(),
        products: productsFound.length > 0 ? productsFound : null
      };

    } catch (error) {
      console.log(error);
      return { reply: "I'm having a little trouble connecting right now, but I'm here to help!" };
    }
  }
};
