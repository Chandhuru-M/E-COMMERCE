// scripts/addBarcodesToProducts.js
// This script adds barcodes to existing products in your database
require('dotenv').config({ path: require('path').join(__dirname, '../config/config.env') });
const connectDatabase = require('../config/database');
const Product = require('../models/productModel');
const { gen } = require('./generateBarcode');
const fs = require('fs');
const path = require('path');

// Create barcodes directory if it doesn't exist
const barcodesDir = path.join(__dirname, '../uploads/barcodes');
if (!fs.existsSync(barcodesDir)) {
  fs.mkdirSync(barcodesDir, { recursive: true });
  console.log('✅ Created barcodes directory:', barcodesDir);
}

async function addBarcodesToProducts() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database');

    // Get all products without barcodes
    const products = await Product.find({ $or: [{ barcode: null }, { barcode: { $exists: false } }] });
    console.log(`\n📦 Found ${products.length} products without barcodes\n`);

    if (products.length === 0) {
      console.log('All products already have barcodes!');
      process.exit(0);
    }

    let count = 0;
    for (const product of products) {
      // Generate barcode code (use product ID or custom format)
      const barcodeCode = `PRD${String(count + 1).padStart(4, '0')}`; // PRD0001, PRD0002, etc.
      
      // Generate barcode image
      const barcodePath = path.join(barcodesDir, `${barcodeCode}.png`);
      await gen(barcodeCode, barcodePath);

      // Update product with barcode
      product.barcode = barcodeCode;
      await product.save();

      console.log(`✅ ${count + 1}. ${product.name} -> ${barcodeCode}`);
      count++;
    }

    console.log(`\n🎉 Successfully added barcodes to ${count} products!`);
    console.log(`📁 Barcode images saved to: ${barcodesDir}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
addBarcodesToProducts();
