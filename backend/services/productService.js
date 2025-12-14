// services/productService.js
const Product = require('../models/productModel'); // your mongoose model


module.exports = {
findByBarcode: async (code) => {
// we assume product.barcode stored as string
return await Product.findOne({ barcode: code });
},


toPublic: (p) => ({
_id: p._id,
id: p._id,
name: p.name,
price: p.price,
sizes: p.sizes || [],
barcode: p.barcode,
image: (p.images && p.images[0] && p.images[0].image) || p.image || null,
images: p.images || [],
stock: p.stock || 0,
description: p.description || '',
category: p.category || ''
})
};