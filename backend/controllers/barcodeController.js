// controllers/barcodeController.js
const ProductService = require('../services/productService');


exports.getByCode = async (req, res) => {
try {
const code = req.params.code;
if (!code) return res.status(400).json({ success:false, message:'code required' });


const product = await ProductService.findByBarcode(code);
if (!product) return res.status(404).json({ success:false, message:'Product not found' });


return res.json({ success:true, product: ProductService.toPublic(product) });
} catch (err) {
console.error(err);
res.status(500).json({ success:false, message: err.message });
}
};