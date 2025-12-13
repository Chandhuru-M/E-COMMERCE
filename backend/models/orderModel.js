
const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    shippingInfo: {
        address: { type: String, required: false },
        country: { type: String, required: false },
        city: { type: String, required: false },
        phoneNo: { type: String, required: false },
        postalCode: { type: String, required: false }
    },

    user: {
        type: mongoose.SchemaTypes.ObjectId,
        required: false, // Optional for POS walk-in customers
        ref: 'User'
    },

    // Merchant ID for POS orders
    merchantId: {
        type: String,
        required: false,
        index: true
    },

    orderItems: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: 'Product' }
    }],

    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },

    paymentInfo: {
        id: { type: String, required: true },
        status: { type: String, required: true }
    },

    paidAt: Date,
    deliveredAt: Date,

    orderStatus: { type: String, required: true, default: 'Processing' },

    createdAt: {
        type: Date,
        default: Date.now
    },

    loyalty: {
        appliedPoints: { type: Number, default: 0 },
        earnedPoints: { type: Number, default: 0 }
    },

    // -------------------------
    // DELIVERY / FULFILLMENT
    // -------------------------
    deliveryStatus: {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"],
        default: "Pending"
    },

    estimatedDelivery: Date,

    trackingUrl: { type: String, default: null },
    trackingId: { type: String, default: null },
    fulfillmentPartner: { type: String, default: null },

    // -------------------------
    // Return / Issue System
    // -------------------------
    returnRequested: { type: Boolean, default: false },
    returnReason: { type: String, default: null },
    returnStatus: {
        type: String,
        enum: ["None", "Requested", "Approved", "Rejected", "Completed"],
        default: "None"
    },

    issueType: { type: String, default: null },
    issueDescription: { type: String, default: null },
    issueStatus: {
        type: String,
        enum: ["None", "Open", "Resolved"],
        default: "None"
    },
    feedback: {
        rating: { type: Number, default: null },
        comment: { type: String, default: null },
        submittedAt: { type: Date, default: null }
    }
});

let orderModel = mongoose.model('Order', orderSchema);

module.exports = orderModel;