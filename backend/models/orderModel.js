
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

    orderStatus: {
  type: String,
  enum: [
    "PLACED",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
  ],
  default: "PLACED",
},

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
  enum: [
    "PLACED",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
  ],
  default: "PLACED",
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
    },
    trackingTimeline: [
  {
    key: String,
    label: String,
    time: Date,
  }
],

});

let orderModel = mongoose.model('Order', orderSchema);

// Track changes to orderStatus/deliveryStatus and notify Telegram
orderSchema.pre('save', function (next) {
  this._statusChanged = this.isModified('orderStatus') || this.isModified('deliveryStatus');
  if (this._statusChanged) {
    console.log(`🟢 [ORDER HOOK] status change detected for order ${this._id} (orderStatus=${this.orderStatus}, deliveryStatus=${this.deliveryStatus})`);
  }
  next();
});

orderSchema.post('save', function (doc) {
  try {
    if (this._statusChanged) {
      console.log(`🟡 [ORDER HOOK] calling notifyOrderStatusChanged for ${doc._id}`);
      const notifier = require('../telegram/telegramBot').notifyOrderStatusChanged;
      if (typeof notifier === 'function') notifier(doc).catch((e) => { console.error('Notifier error (post save):', e && e.message ? e.message : e); });
    } else {
      console.log(`⚪ [ORDER HOOK] no status change for ${doc._id}`);
    }
  } catch (e) {}
});

// Handle findOneAndUpdate scenarios — attempt to detect status fields in the update
orderSchema.post('findOneAndUpdate', async function (doc) {
  try {
    if (!doc) return;
    const update = this.getUpdate && this.getUpdate();
    if (!update) return;

    const direct = update.orderStatus || update.deliveryStatus;
    const setObj = update.$set || {};
    const changed = Boolean(direct || setObj.orderStatus || setObj.deliveryStatus);
    if (changed) {
      console.log(`🟡 [ORDER HOOK] findOneAndUpdate detected status change for ${doc._id}`);
      const notifier = require('../telegram/telegramBot').notifyOrderStatusChanged;
      if (typeof notifier === 'function') await notifier(doc).catch((e) => { console.error('Notifier error (findOneAndUpdate):', e && e.message ? e.message : e); });
    } else {
      console.log(`⚪ [ORDER HOOK] findOneAndUpdate no status change for ${doc._id}`);
    }
  } catch (e) {}
});

module.exports = orderModel;