// scripts/regenerateBarcodes.js
// Force regenerate all barcode images with white background
require('dotenv').config({ path: require('path').join(__dirname, '../config/config.env') });
const connectDatabase = require('../config/database');
const Product = require('../models/productModel');
const { gen } = require('./generateBarcode');
const fs = require('fs');
const path = require('path');

const barcodesDir = path.join(__dirname, '../uploads/barcodes');

async function regenerateBarcodes() {
  try {
    await connectDatabase();
    console.log('✅ Connected to database\n');

    // Get all products WITH barcodes
    const products = await Product.find({ barcode: { $exists: true, $ne: null } });
    console.log(`📦 Found ${products.length} products with barcodes\n`);

    if (products.length === 0) {
      console.log('No products have barcodes yet. Run addBarcodesToProducts.js first.');
      process.exit(0);
    }

    let count = 0;
    for (const product of products) {
      const barcodeCode = product.barcode;
      const barcodePath = path.join(barcodesDir, `${barcodeCode}.png`);
      
      // Regenerate barcode image with white background
      await gen(barcodeCode, barcodePath);

      console.log(`✅ ${count + 1}. Regenerated ${barcodeCode} (${product.name})`);
      count++;
    }

    console.log(`\n🎉 Successfully regenerated ${count} barcodes with white background!`);
    console.log(`📁 Barcode images saved to: ${barcodesDir}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

regenerateBarcodes();
