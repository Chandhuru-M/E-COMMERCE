const Product = require("../models/productModel");
const axios = require("axios");
const mongoose = require("mongoose");

module.exports = {
  checkInventory: async (sku) => {
    // 1. Check your local DB first
    let product = null;
    
    try {
        if (mongoose.isValidObjectId(sku)) {
            product = await Product.findById(sku);
        } else {
            // Search by name if not an ID
            const regex = new RegExp(sku, 'i');
            product = await Product.findOne({ name: regex });
        }
    } catch (err) {
        console.error("Error checking inventory in DB:", err);
    }

    if (product) {
      return {
        found: true,
        product: product.toObject(),
        stock: product.stock,
        deliveryAvailable: product.stock > 0,
        message: product.stock > 0
          ? `Item "${product.name}" is available for online delivery. Stock: ${product.stock}`
          : `Item "${product.name}" is currently out of stock online.`
      };
    }

    // 2. Fallback external API (optional)
    try {
      const res = await axios.get("https://fakestoreapi.com/products");
      const data = res.data;

      const match = data.find(item =>
        item.id == sku ||
        item.title.toLowerCase().includes(sku.toLowerCase())
      );

      if (match) {
        return {
          found: true,
          product: {
            sku: match.id,
            name: match.title,
            price: match.price,
            category: match.category,
            image: match.image,
            stock: 50  // online warehouse mock stock
          },
          stock: 50,
          deliveryAvailable: true,
          message: "Item available for online delivery."
        };
      }
    } catch (err) {
      console.log("Fallback API error:", err.message);
    }

    // 3. Not found anywhere
    return {
      found: false,
      message: "Item not available for online purchase."
    };
  }
};
