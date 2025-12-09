// const mongoose = require('mongoose');

// const orderSchema = mongoose.Schema({
//     shippingInfo: {
//         address: {
//             type: String,
//             required: true
//         },
//         country: {
//             type: String,
//             required: true
//         },
//         city: {
//             type: String,
//             required: true
//         },
//         phoneNo: {
//             type: String,
//             required: true
//         },
//         postalCode: {
//             type: String,
//             required: true
//         }
        
//     },
//     user: {
//         type: mongoose.SchemaTypes.ObjectId,
//         required: true,
//         ref: 'User'
//     },
//     orderItems: [{
//         name: {
//             type: String,
//             required: true
//         },
//         quantity: {
//             type: Number,
//             required: true
//         },
//         image: {
//             type: String,
//             required: true
//         },
//         price: {
//             type: Number,
//             required: true
//         },
//         product: {
//             type: mongoose.SchemaTypes.ObjectId,
//             required: true,
//             ref: 'Product'
//         }

//     }],
//     itemsPrice: {
//         type: Number,
//         required: true,
//         default: 0.0
//     },
//     taxPrice: {
//         type: Number,
//         required: true,
//         default: 0.0
//     },
//     shippingPrice: {
//         type: Number,
//         required: true,
//         default: 0.0
//     },
//     totalPrice: {
//         type: Number,
//         required: true,
//         default: 0.0
//     },
//     paymentInfo: {
//         id: {
//             type: String,
//             required: true
//         },
//         status: {
//             type: String,
//             required: true
//         }
//     },
//     paidAt: {
//         type: Date
//     },
//     deliveredAt: {
//         type: Date
//     },
//     orderStatus: {
//         type: String,
//         required: true,
//         default: 'Processing'
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     },loyalty: {
//   appliedPoints: { type: Number, default: 0 },
//   earnedPoints: { type: Number, default: 0 }
// },
//     deliveryStatus: {
//         type: String,
//         enum: ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"],
//         default: "Pending"
//     },
//     estimatedDelivery: Date
// })

// let orderModel = mongoose.model('Order', orderSchema);

// module.exports = orderModel;

const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  shippingInfo: {
    address: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    phoneNo: { type: String, required: true },
    postalCode: { type: String, required: true },
  },

  user: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    ref: "User",
  },

  orderItems: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: "Product",
      },
    },
  ],

  itemsPrice: { type: Number, required: true, default: 0.0 },
  taxPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },

  paymentInfo: {
    id: { type: String, required: true },
    status: { type: String, required: true },
  },

  paidAt: Date,
  deliveredAt: Date,

  orderStatus: {
    type: String,
    required: true,
    default: "Processing",
  },

  // 🟦 Loyalty System
  loyalty: {
    appliedPoints: { type: Number, default: 0 },
    earnedPoints: { type: Number, default: 0 },
  },

  // 🟦 Delivery Tracking System
  deliveryStatus: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"],
    default: "Pending",
  },

  estimatedDelivery: {
    type: Date,
  },

  // 🟦 Post-Purchase System
  postPurchaseStatus: {
    type: String,
    enum: ["None", "Pending Feedback", "Completed", "Issue Raised"],
    default: "None",
  },

  // 🟦 Feedback Storage
  feedback: {
    rating: { type: Number },
    comment: { type: String },
    date: { type: Date },
  },

  // 🟦 Issues / Complaints
  issue: {
    issueType: { type: String },
    description: { type: String },
    date: { type: Date },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
