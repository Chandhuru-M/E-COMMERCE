// controllers/posController.js
const Product = require('../models/productModel');
const POSCart = require('../models/posCartModel');
const Order = require('../models/orderModel');
const { getIo } = require('../socketManager');

// Scan barcode and add to merchant's POS cart
exports.scanBarcode = async (req, res) => {
  try {
    const { barcode, merchantId } = req.body;
    
    if (!barcode) return res.status(400).json({ success: false, message: 'Barcode required' });
    if (!merchantId) return res.status(400).json({ success: false, message: 'Merchant ID required' });

    // Find product by barcode (optionally filter by merchantId if products are merchant-specific)
    const product = await Product.findOne({ barcode });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Check stock
    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Product out of stock' });
    }

    // Find or create POS cart for this merchant
    let cart = await POSCart.findOne({ merchantId });
    if (!cart) {
      cart = await POSCart.create({ merchantId, items: [] });
    }

    // Check if product already in cart
    const existing = cart.items.find(i => i.productId.equals(product._id));
    if (existing) {
      // Check if adding one more exceeds stock
      if (existing.quantity + 1 > product.stock) {
        return res.status(400).json({ success: false, message: 'Insufficient stock' });
      }
      existing.quantity += 1;
    } else {
      cart.items.push({ 
        productId: product._id, 
        quantity: 1, 
        price: product.price 
      });
    }

    await cart.save();
    await cart.populate('items.productId');

    // Emit real-time event
    try {
      getIo().emit('pos_event', { 
        type: 'scan', 
        merchantId, 
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          barcode: product.barcode
        }, 
        cart 
      });
    } catch (e) {
      console.warn('Socket emit failed:', e.message);
    }

    return res.json({ success: true, cart, product });
  } catch (err) {
    console.error('POS Scan error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Remove item from POS cart
exports.removeItem = async (req, res) => {
  try {
    const { barcode, merchantId } = req.body;
    
    if (!barcode) return res.status(400).json({ success: false, message: 'Barcode required' });
    if (!merchantId) return res.status(400).json({ success: false, message: 'Merchant ID required' });

    const product = await Product.findOne({ barcode });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const cart = await POSCart.findOne({ merchantId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(i => !i.productId.equals(product._id));
    await cart.save();

    try {
      getIo().emit('pos_event', { type: 'remove', merchantId, product, cart });
    } catch (e) {}

    return res.json({ success: true, cart });
  } catch (err) {
    console.error('Remove item error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Checkout POS cart and create order
exports.checkoutPOS = async (req, res) => {
  try {
    const { merchantId, paymentMethod, customerId, customerEmail, amountReceived } = req.body;
    
    if (!merchantId) return res.status(400).json({ success: false, message: 'Merchant ID required' });
    if (!paymentMethod) return res.status(400).json({ success: false, message: 'Payment method required' });

    // Get cart with populated products
    const cart = await POSCart.findOne({ merchantId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate total
    let total = 0;
    cart.items.forEach(i => {
      total += i.price * i.quantity;
    });

    // Verify payment amount (if provided)
    if (amountReceived && amountReceived < total) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient payment. Required: $${total.toFixed(2)}, Received: $${amountReceived.toFixed(2)}` 
      });
    }

    // Determine payment status based on payment method
    let paymentStatus = 'PAID'; // POS payments are immediate
    let paymentId = '';
    
    if (paymentMethod === 'cash') {
      paymentId = `CASH_${Date.now()}`;
    } else if (paymentMethod === 'upi') {
      paymentId = `UPI_${Date.now()}`;
    } else {
      paymentId = `POS_${Date.now()}`;
    }

    // Create order (link to customer if provided)
    const order = await Order.create({
      user: customerId || null, // Link to customer if provided, otherwise walk-in
      merchantId: merchantId,
      orderItems: cart.items.map(i => ({
        name: i.productId.name,
        quantity: i.quantity,
        price: i.price,
        image: i.productId.images && i.productId.images[0] ? i.productId.images[0].image : '',
        product: i.productId._id
      })),
      totalPrice: total,
      itemsPrice: total,
      taxPrice: 0,
      shippingPrice: 0,
      paymentInfo: {
        id: paymentId,
        status: paymentStatus,
        method: paymentMethod.toUpperCase(),
        amountReceived: amountReceived || total
      },
      paidAt: Date.now(),
      orderStatus: 'Processing',
      deliveredAt: null
    });

    // Reduce stock for each item
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Delete cart after successful checkout
    await POSCart.deleteOne({ merchantId });

    // Emit checkout event
    try {
      getIo().emit('pos_event', { type: 'checkout', merchantId, order });
    } catch (e) {}

    return res.json({ 
      success: true, 
      order,
      change: amountReceived ? (amountReceived - total).toFixed(2) : 0
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};