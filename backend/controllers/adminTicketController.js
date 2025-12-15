const Ticket = require('../models/ticketModel');
const { sendTicketEmail } = require('../services/emailService');
const { sendTicketNotification } = require('../telegram/ticketNotifications');

// ========================
// ADMIN FUNCTIONS
// ========================

/**
 * Get all tickets (admin dashboard)
 */
exports.getAllTickets = async (req, res) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 20, search } = req.query;

    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const tickets = await Ticket.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('merchantId', 'shopName email')
      .populate('assignedTo', 'name email')
      .populate('relatedOrderId', 'orderId')
      .select('-messages'); // Exclude messages in list view

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
 * Get ticket with full details
 */
exports.getTicketFullDetail = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .populate('userId', 'name email phone')
      .populate('merchantId', 'shopName email phone')
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name email avatar role')
      .populate('relatedOrderId')
      .populate('relatedProductId', 'name price category');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
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
 * Assign ticket to support staff
 */
exports.assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { assignToId, internalNote } = req.body;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Get admin name
    const admin = await require('../models/userModel').findById(assignToId);

    ticket.assignedTo = assignToId;
    ticket.assignedToName = admin?.name || 'Support Staff';
    ticket.status = 'IN_PROGRESS';

    // Add internal note if provided
    if (internalNote) {
      ticket.messages.push({
        sender: req.user._id,
        senderRole: 'Admin',
        senderName: req.user.name,
        message: `[INTERNAL NOTE] ${internalNote}`,
        isInternal: true,
        timestamp: new Date()
      });
    }

    await ticket.save();

    // Notify assigned staff
    await sendTicketEmail({
      to: admin?.email,
      type: 'TICKET_ASSIGNED',
      ticket,
      staffName: admin?.name
    }).catch(err => console.error('Email error:', err.message));

    res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
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
 * Add admin reply to ticket
 */
exports.addAdminReply = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, attachments = [], isInternal = false } = req.body;

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

    ticket.messages.push({
      sender: req.user._id,
      senderRole: 'Admin',
      senderName: req.user.name,
      message,
      attachments,
      isInternal,
      timestamp: new Date()
    });

    if (!isInternal) {
      ticket.status = 'IN_PROGRESS';
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    // Send email to customer if not internal
    if (!isInternal && ticket.userId) {
      const user = await require('../models/userModel').findById(ticket.userId);
      await sendTicketEmail({
        to: user?.email,
        type: 'TICKET_REPLIED',
        ticket,
        userName: user?.name,
        message
      }).catch(err => console.error('Email error:', err.message));
    }

    // Send Telegram notification
    await sendTicketNotification({
      type: 'TICKET_REPLIED_ADMIN',
      ticket,
      adminName: req.user.name,
      message
    }).catch(err => console.error('Telegram error:', err.message));

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
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
 * Resolve/Close ticket
 */
exports.resolveTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { resolutionNote, status = 'RESOLVED' } = req.body;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    ticket.status = status;
    ticket.resolution.resolutionNote = resolutionNote;
    ticket.resolution.resolutionDate = new Date();
    ticket.resolvedAt = new Date();

    // Calculate resolution time
    if (ticket.createdAt) {
      ticket.resolutionTime = ticket.resolvedAt - ticket.createdAt;
    }

    await ticket.save();

    // Send resolution email to customer
    if (ticket.userId) {
      const user = await require('../models/userModel').findById(ticket.userId);
      await sendTicketEmail({
        to: user?.email,
        type: 'TICKET_RESOLVED',
        ticket,
        userName: user?.name,
        resolutionNote
      }).catch(err => console.error('Email error:', err.message));
    }

    // Send Telegram notification
    await sendTicketNotification({
      type: 'TICKET_RESOLVED',
      ticket,
      resolutionNote
    }).catch(err => console.error('Telegram error:', err.message));

    res.status(200).json({
      success: true,
      message: 'Ticket resolved successfully',
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
 * Get dashboard analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const dateQuery = {};
    if (dateFrom) dateQuery.$gte = new Date(dateFrom);
    if (dateTo) dateQuery.$lte = new Date(dateTo);

    // Build match stage - if no date filters, match all documents
    const matchStage = Object.keys(dateQuery).length > 0 ? { createdAt: dateQuery } : {};

    // Overall stats
    const stats = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: {
            $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] }
          },
          avgSatisfaction: { $avg: '$resolution.satisfactionScore' }
        }
      }
    ]);

    // Tickets by priority
    const byPriority = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Tickets by category
    const byCategory = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Average resolution time
    const resolutionTimes = await Ticket.aggregate([
      {
        $match: {
          ...matchStage,
          status: 'RESOLVED'
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$resolutionTime' },
          maxTime: { $max: '$resolutionTime' },
          minTime: { $min: '$resolutionTime' }
        }
      }
    ]);

    // Top issues
    const topIssues = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        stats: stats[0] || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, avgSatisfaction: null },
        byPriority,
        byCategory,
        resolutionTimes: resolutionTimes[0] || { avgTime: null, maxTime: null, minTime: null },
        topIssues
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get staff performance metrics
 */
exports.getStaffMetrics = async (req, res) => {
  try {
    const staffMetrics = await Ticket.aggregate([
      {
        $match: { assignedTo: { $ne: null } }
      },
      {
        $group: {
          _id: '$assignedTo',
          totalTickets: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] }
          },
          avgSatisfaction: { $avg: '$resolution.satisfactionScore' }
        }
      }
    ]);

    // Populate staff names
    const populated = await require('../models/userModel').populate(
      staffMetrics,
      { path: '_id', select: 'name email' }
    );

    res.status(200).json({
      success: true,
      staffMetrics: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Escalate ticket
 */
exports.escalateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reason } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        isEscalated: true,
        priority: 'URGENT'
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Send escalation notification
    await sendTicketNotification({
      type: 'TICKET_ESCALATED',
      ticket,
      reason
    }).catch(err => console.error('Telegram error:', err.message));

    res.status(200).json({
      success: true,
      message: 'Ticket escalated successfully',
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
 * Create/Manage FAQ (Admin only)
 */
exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, category, userRole, tags } = req.body;

    const FAQ = require('../models/faqModel');
    const faq = await FAQ.create({
      question,
      answer,
      category,
      userRole: userRole || 'ALL',
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update FAQ
 */
exports.updateFAQ = async (req, res) => {
  try {
    const { faqId } = req.params;
    const { question, answer, category, userRole, isActive, tags } = req.body;

    const FAQ = require('../models/faqModel');
    const faq = await FAQ.findByIdAndUpdate(
      faqId,
      {
        question,
        answer,
        category,
        userRole,
        isActive,
        tags,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete FAQ
 */
exports.deleteFAQ = async (req, res) => {
  try {
    const { faqId } = req.params;

    const FAQ = require('../models/faqModel');
    await FAQ.findByIdAndDelete(faqId);

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
