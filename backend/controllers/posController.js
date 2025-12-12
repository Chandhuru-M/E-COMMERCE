// controllers/posController.js
const ProductService = require('../services/productService');
const CartService = require('../services/cartService');
const PaymentService = require('../services/paymentService');
const { getIo } = require('../socketManager');


exports.scanBarcode = async (req, res) => {
try {
const { barcode } = req.body;
if (!barcode) return res.status(400).json({ success:false, message:'barcode required' });


const product = await ProductService.findByBarcode(barcode);
if (!product) return res.status(404).json({ success:false, message:'Product not found' });


// add to temporary POS cart (store-locale); here we use CartService to maintain a session-less cart or store cart
const cartItem = await CartService.addByProductId(product._id, 1);


// Emit real-time event to interested clients
try { getIo().emit('pos_event', { type:'scan', product: ProductService.toPublic(product), cart: await CartService.summary() }); } catch(e){ console.warn('io emit failed', e.message); }


return res.json({ success:true, product: ProductService.toPublic(product), cart: cartItem });
} catch (err) {
console.error(err);
return res.status(500).json({ success:false, message: err.message });
}
};


exports.removeItem = async (req, res) => {
try {
const { barcode } = req.body;
if (!barcode) return res.status(400).json({ success:false, message:'barcode required' });


const product = await ProductService.findByBarcode(barcode);
if (!product) return res.status(404).json({ success:false, message:'Product not found' });


const removed = await CartService.removeByProductId(product._id);


try { getIo().emit('pos_event', { type:'remove', product: ProductService.toPublic(product), cart: await CartService.summary() }); } catch(e){}


return res.json({ success:true, removed });
} catch (err) {
console.error(err);
return res.status(500).json({ success:false, message: err.message });
}
};
exports.checkout = async (req, res) => {
try {
// prepare summary
const summary = await CartService.summary();


// simulate payment
const payment = await PaymentService.startPayment({ amount: summary.payable, method: 'pos-sim' });


// finalize order in orders service (omitted: implement your order creation)
// emit pos_event checkout
try { getIo().emit('pos_event', { type:'checkout', summary, payment }); } catch(e){}


// clear cart
await CartService.clear();


return res.json({ success:true, summary, payment });
} catch (err) {
console.error(err);
return res.status(500).json({ success:false, message: err.message });
}
};