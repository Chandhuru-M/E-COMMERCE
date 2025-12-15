const Ticket = require('../models/ticketModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { sendTicketEmail } = require('../services/emailService');
const { sendTicketNotification } = require('../telegram/ticketNotifications');

// Generate unique ticket ID
const generateTicketId = async () => {
  const count = await Ticket.countDocuments();
  return `TKT-${Date.now()}-${count + 1}`;
};

// ========================
// USER/MERCHANT FUNCTIONS
// ========================

/**
 * Create a new support ticket
 */
exports.createTicket = async (req, res) => {
  try {
    const { type, subject, description, category, priority, relatedOrderId, relatedProductId, attachments } = req.body;
    const userId = req.user._id;
    const userEmail = req.user.email;
    const userName = req.user.name;

    // Validate required fields
    if (!type || !subject || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type, subject, and description are required' 
      });
    }

    const ticketId = await generateTicketId();

    const ticketData = {
      ticketId,
      type,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'MEDIUM',
      userId: userId,
      relatedOrderId: relatedOrderId || null,
      relatedProductId: relatedProductId || null,
      attachments: attachments || [],
      status: 'OPEN',
      createdAt: new Date()
    };

    // Set merchantId if it's a merchant type ticket
    if (type.includes('MERCHANT')) {
      ticketData.merchantId = userId;
    }

    // Add first message
    ticketData.messages = [
      {
        sender: userId,
        senderRole: 'User',
        senderName: userName,
        message: description,
        attachments: attachments || []
      }
    ];

    const ticket = await Ticket.create(ticketData);

    // Populate for response
    await ticket.populate('userId', 'name email').populate('relatedOrderId');

    // Send confirmation email
    await sendTicketEmail({
      to: userEmail,
      type: 'TICKET_CREATED',
      ticket,
      userName
    }).catch(err => console.error('Email error:', err.message));

    // Send Telegram notification to admin
    await sendTicketNotification({
      type: 'TICKET_CREATED',
      ticket,
      userName
    }).catch(err => console.error('Telegram error:', err.message));

    res.status(201).json({ 
      success: true, 
      message: 'Ticket created successfully',
      ticket 
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get user's tickets
 */
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { status, priority, page = 1, limit = 10 } = req.query;

    // Build query based on user role
    let query = {};
    
    // If user is a merchant, get merchant tickets; otherwise get user tickets
    if (userRole === 'merchant_admin') {
      query.merchantId = userId;
    } else {
      query.userId = userId;
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('relatedOrderId', 'orderId totalPrice orderStatus')
      .populate('relatedProductId', 'name price');

    const total = await Ticket.countDocuments(query);

    res.status(200).json({ 
      success: true, 
      tickets,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: tickets.length,
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get single ticket with messages
 */
exports.getTicketDetail = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id;

    const ticket = await Ticket.findById(ticketId)
      .populate('messages.sender', 'name email avatar')
      .populate('relatedOrderId')
      .populate('relatedProductId')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Verify user has access to this ticket
    if (ticket.userId.toString() !== userId.toString() && ticket.merchantId?.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    res.status(200).json({ 
      success: true, 
      ticket 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Add message to ticket
 */
exports.addMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, attachments = [] } = req.body;
    const userId = req.user._id;
    const userName = req.user.name;

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Message cannot be empty' 
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Verify user has access
    if (ticket.userId?.toString() !== userId.toString() && ticket.merchantId?.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    const newMessage = {
      sender: userId,
      senderRole: 'User',
      senderName: userName,
      message,
      attachments,
      timestamp: new Date()
    };

    ticket.messages.push(newMessage);
    ticket.status = 'IN_PROGRESS';
    ticket.updatedAt = new Date();

    await ticket.save();
    await ticket.populate('messages.sender', 'name email');

    // Send notification email to assigned staff
    if (ticket.assignedTo) {
      await sendTicketEmail({
        to: ticket.assignedToName,
        type: 'TICKET_MESSAGE',
        ticket,
        userName,
        message
      }).catch(err => console.error('Email error:', err.message));
    }

    // Send Telegram notification
    await sendTicketNotification({
      type: 'TICKET_MESSAGE',
      ticket,
      userName,
      message
    }).catch(err => console.error('Telegram error:', err.message));

    res.status(200).json({ 
      success: true, 
      message: 'Message added successfully',
      ticket 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Rate and close ticket
 */
exports.closeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { satisfactionScore, feedback, resolutionNote } = req.body;
    const userId = req.user._id;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Verify ownership
    if (ticket.userId?.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    ticket.status = 'CLOSED';
    ticket.closedAt = new Date();
    ticket.resolution = {
      satisfactionScore: satisfactionScore || null,
      feedback: feedback || null,
      resolutionNote: resolutionNote || null
    };

    await ticket.save();

    // Send closure email
    await sendTicketEmail({
      to: req.user.email,
      type: 'TICKET_CLOSED',
      ticket,
      userName: req.user.name,
      satisfactionScore
    }).catch(err => console.error('Email error:', err.message));

    res.status(200).json({ 
      success: true, 
      message: 'Ticket closed successfully',
      ticket 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get FAQ list
 */
exports.getFAQ = async (req, res) => {
  try {
    const { category, userRole = 'USER', search } = req.query;

    let query = { isActive: true };

    if (category) query.category = category;
    
    // Show FAQs relevant to user role
    if (userRole) {
      query.$or = [
        { userRole: 'ALL' },
        { userRole: userRole }
      ];
    }

    // Search functionality
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } }
      ];
    }

    const faqs = await query 
      ? Object.assign(query, { isActive: true })
      : { isActive: true };

    const faqList = await require('../models/faqModel').find(query)
      .sort({ isPopular: -1, order: 1 })
      .select('question answer category tags views helpfulCount');

    res.status(200).json({ 
      success: true, 
      faqs: faqList,
      count: faqList.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Mark FAQ as helpful
 */
exports.markFAQHelpful = async (req, res) => {
  try {
    const { faqId } = req.params;
    const { helpful } = req.body;

    const FAQ = require('../models/faqModel');
    const faq = await FAQ.findByIdAndUpdate(
      faqId,
      helpful 
        ? { $inc: { helpfulCount: 1, views: 1 } }
        : { $inc: { unhelpfulCount: 1, views: 1 } },
      { new: true }
    );

    res.status(200).json({ 
      success: true, 
      faq 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
