// services/cartService.js
// Minimal example using a simple in-memory cart per store (for demo). Replace with DB-backed cart per store/terminal in production.
let CART = { items: [], subtotal: 0 };
const ProductModel = require('../models/productModel');


function recalc() {
let subtotal = 0;
for (const it of CART.items) subtotal += (it.price * it.qty);
CART.subtotal = subtotal;
CART.payable = subtotal; // apply taxes/discounts in real impl
}


module.exports = {
addByProductId: async (productId, qty = 1) => {
const p = await ProductModel.findById(productId);
if (!p) throw new Error('Product not found');
const existing = CART.items.find(i => String(i.product) === String(productId));
if (existing) existing.qty += qty; else CART.items.push({ product: productId, name: p.name, price: p.price, qty });
recalc();
return CART;
},


removeByProductId: async (productId) => {
CART.items = CART.items.filter(i => String(i.product) !== String(productId));
recalc();
return CART;
},


summary: async () => ({ items: CART.items, subtotal: CART.subtotal, payable: CART.payable }),


clear: async () => { CART = { items: [], subtotal: 0 }; return CART; }
};