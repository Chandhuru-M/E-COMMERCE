// const Product = require("../models/productModel");

// module.exports = {
//   checkInventory: async (sku) => {

//     // 1️⃣ Fetch product from DB
//     const product = await Product.findOne({ sku });

//     if (product) {
//       return {
//         found: true,
//         product,
//         stock: product.stock,
//         deliveryAvailable: product.stock > 0,
//         message:
//           product.stock > 0
//             ? "Item available for online delivery."
//             : "Out of stock online."
//       };
//     }

//     // 2️⃣ No product found
//     return {
//       found: false,
//       message: "Product not found in inventory."
//     };
//   },
//   checkStock: async (productId, quantity) => {
//     try {
//         const product = await Product.findById(productId);
//         if (!product) return false;
//         return product.stock >= quantity;
//     } catch (error) {
//         console.error("Inventory Agent Error:", error);
//         return false;
//     }
//   },
//   updateStock: async (productId, quantity) => {
//     try {
//         const product = await Product.findById(productId);
//         if (!product) return;
//         product.stock -= quantity;
//         await product.save();
//     } catch (error) {
//         console.error("Inventory Agent Update Error:", error);
//     }
//   }
// };
// backend/agents/inventoryAgent.js
const inventoryService = require("../services/inventoryService");
const Product = require("../models/productModel");

class InventoryAgent {
  async reserve(userId, items) {
    return await inventoryService.reserveStock(userId, items);
  }

  async checkInventory(productName) {
    try {
      // Simple regex search for the product
      const product = await Product.findOne({ 
        name: { $regex: productName, $options: "i" } 
      });

      if (product) {
        return {
          found: true,
          product: product.name,
          stock: product.stock,
          message: product.stock > 0 ? "In Stock" : "Out of Stock"
        };
      }
      return { found: false, message: "Product not found" };
    } catch (error) {
      console.error("Inventory check error:", error);
      return { error: "Error checking inventory" };
    }
  }
}

module.exports = new InventoryAgent();
