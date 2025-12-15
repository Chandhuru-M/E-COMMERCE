const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  
  answer: { 
    type: String, 
    required: true
  },
  
  category: { 
    type: String, 
    enum: ['USER', 'MERCHANT', 'GENERAL', 'PAYMENT', 'DELIVERY', 'RETURNS', 'ACCOUNT', 'PRODUCT', 'ORDERS'],
    default: 'GENERAL'
  },
  
  userRole: { 
    type: String, 
    enum: ['USER', 'MERCHANT', 'ALL'], 
    default: 'ALL'
  },
  
  tags: [String], // For better search
  
  views: { 
    type: Number, 
    default: 0
  },
  
  helpfulCount: { 
    type: Number, 
    default: 0
  },
  
  unhelpfulCount: {
    type: Number,
    default: 0
  },
  
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  
  isPopular: {
    type: Boolean,
    default: false
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
faqSchema.index({ category: 1, isActive: 1 });
faqSchema.index({ userRole: 1, isActive: 1 });
faqSchema.index({ tags: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
