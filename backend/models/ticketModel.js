const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { 
    type: String, 
    unique: true,
    required: true
  },
  
  // User/Merchant info
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    sparse: true
  },
  merchantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Merchant',
    sparse: true
  },
  
  // Ticket details
  type: { 
    type: String, 
    enum: ['USER_QUERY', 'MERCHANT_QUERY', 'ORDER_ISSUE', 'PAYMENT_ISSUE', 'PRODUCT_COMPLAINT', 'RETURN_REFUND', 'TECHNICAL', 'BILLING', 'ACCOUNT'],
    required: true 
  },
  
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  
  status: { 
    type: String, 
    enum: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_MERCHANT', 'RESOLVED', 'CLOSED', 'REOPENED'],
    default: 'OPEN'
  },
  
  subject: { 
    type: String, 
    required: true,
    trim: true
  },
  
  description: { 
    type: String, 
    required: true
  },
  
  category: { 
    type: String,
    enum: ['product', 'order', 'payment', 'delivery', 'return', 'refund', 'technical', 'account', 'other'],
    default: 'other'
  },
  
  // Related entities
  relatedOrderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    sparse: true
  },
  
  relatedProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    sparse: true
  },
  
  attachments: [
    {
      filename: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  
  // Conversation thread
  messages: [
    {
      sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        refPath: 'messages.senderRole'
      },
      senderRole: { 
        type: String, 
        enum: ['User', 'Merchant', 'Admin'],
        required: true
      },
      senderName: String,
      message: String,
      attachments: [
        {
          filename: String,
          url: String
        }
      ],
      timestamp: { 
        type: Date, 
        default: Date.now 
      },
      isInternal: { 
        type: Boolean, 
        default: false 
      } // Only visible to support staff
    }
  ],
  
  // Support staff assignment
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin',
    sparse: true
  },
  
  assignedToName: String,
  
  // Resolution details
  resolution: {
    resolutionNote: String,
    resolutionDate: Date,
    satisfactionScore: { 
      type: Number, 
      min: 1, 
      max: 5,
      sparse: true
    },
    feedback: String
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  resolvedAt: Date,
  closedAt: Date,
  
  // SLA tracking
  responseTime: Number, // milliseconds
  resolutionTime: Number, // milliseconds
  
  // Additional tracking
  tags: [String],
  isEscalated: { type: Boolean, default: false }
  ,
  // Telegram linkage (optional) - store chat id to notify users who created tickets via Telegram
  telegramChatId: {
    type: String,
    sparse: true
  }
});

// Indexes for better query performance
ticketSchema.index({ userId: 1, createdAt: -1 });
ticketSchema.index({ merchantId: 1, createdAt: -1 });
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ priority: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

// Pre-save hook to update updatedAt
ticketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
