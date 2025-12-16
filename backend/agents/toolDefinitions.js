const recommendAgent = require("./recommendationAgent");
const orderAgent = require("./orderAgent");
const loyaltyAgent = require("./loyaltyAgent");
const inventoryAgent = require("./inventoryAgent");

// 1. Define the Tools for Gemini (JSON Schema)
const tools = [
  {
    function_declarations: [
      {
        name: "search_products",
        description: "Search for products in the catalog based on a query (e.g., 'red shoes', 'watches'). Returns a list of products with prices and details.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "The search term or product description."
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_my_orders",
        description: "Fetch the user's recent order history. Use this when the user asks to see their orders.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: {
              type: "NUMBER",
              description: "Number of orders to fetch (default 5)."
            }
          }
        }
      },
      {
        name: "track_order",
        description: "Get detailed status of a specific order by its ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            orderId: {
              type: "STRING",
              description: "The unique ID of the order."
            }
          },
          required: ["orderId"]
        }
      },
      {
        name: "check_loyalty_points",
        description: "Check the user's loyalty points and available discount.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "check_inventory",
        description: "Check if a specific product is in stock.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "Name of the product to check."
            }
          },
          required: ["productName"]
        }
      },
      {
        name: "add_to_cart",
        description: "Add a product to the user's shopping cart.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: {
              type: "STRING",
              description: "Name of the product to add."
            },
            quantity: {
              type: "NUMBER",
              description: "Quantity to add (default 1)."
            }
          },
          required: ["productName"]
        }
      },
      {
        name: "get_cart_items",
        description: "Get the list of items currently in the user's shopping cart.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      }
    ]
  }
];

// 2. Define the Execution Logic (The "Router")
const executeTool = async (functionName, args, session) => {
  console.log(`🛠️ Executing Tool: ${functionName}`, args);

  try {
    switch (functionName) {
      case "search_products":
        return await recommendAgent.getRecommendations(args.query, session.user?._id);

      case "get_my_orders":
        return await orderAgent.getMyOrders(session.user?._id, args.limit);

      case "track_order":
        return await orderAgent.trackOrder(args.orderId);

      case "check_loyalty_points":
        const discount = await loyaltyAgent.getDiscount(session.user?._id);
        return { discount_percentage: discount, message: `You have a ${discount}% discount available.` };

      case "check_inventory":
        return await inventoryAgent.checkInventory(args.productName);

      case "add_to_cart":
        // In a real app, this would call a CartService. 
        // For now, we push to the session cart as per existing logic.
        session.cart.push({ product: args.productName, quantity: args.quantity || 1 });
        return { success: true, message: `Added ${args.productName} to your cart.`, current_cart_size: session.cart.length };

      case "get_cart_items":
        // If the session cart is empty, it might be because we haven't synced with the real DB cart yet
        // The controller now passes the DB cart in session.cart
        if (!session.cart || session.cart.length === 0) {
          return { message: "Your cart is currently empty." };
        }
        return { 
          message: "Here are the items in your cart:", 
          items: session.cart.map(item => `${item.product} (x${item.quantity || 1}) - $${item.price || '?'}`) 
        };

      default:
        return { error: "Function not found" };
    }
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    return { error: "Tool execution failed", details: error.message };
  }
};

module.exports = { tools, executeTool };
