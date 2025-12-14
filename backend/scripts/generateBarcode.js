// scripts/generateBarcode.js
const bwipjs = require('bwip-js');
const fs = require('fs');

async function gen(productId, outPath) {
  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text: productId,
    scale: 3,
    height: 10,
    includetext: true,
    backgroundcolor: 'ffffff',  // White background
    paddingwidth: 10,           // Add padding for better scanning
    paddingheight: 10
  });
  fs.writeFileSync(outPath, png);
}

// usage: node scripts/generateBarcode.js PRD1023 ./public/barcodes/PRD1023.png

// CLI execution
if (require.main === module) {
  const [productId, outPath] = process.argv.slice(2);
  
  if (!productId || !outPath) {
    console.error('Usage: node scripts/generateBarcode.js <productId> <outPath>');
    console.error('Example: node scripts/generateBarcode.js PRD1023 ./public/barcodes/PRD1023.png');
    process.exit(1);
  }

  gen(productId, outPath)
    .then(() => console.log(`Barcode generated: ${outPath}`))
    .catch(err => console.error('Error generating barcode:', err));
}

module.exports = { gen };
