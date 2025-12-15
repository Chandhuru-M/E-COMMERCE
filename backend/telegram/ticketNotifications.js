const User = require('../models/userModel');

/**
 * Send Telegram notifications for ticket events
 */
const sendTicketNotification = async ({
  type,
  ticket,
  userName,
  message,
  resolutionNote,
  reason,
  adminName
}) => {
  try {
    const { bot } = require('./telegramBot');
    
    if (!bot) {
      console.warn('⚠️ Telegram bot not initialized');
      return false;
    }

    let notificationMessage = '';
    let adminChatIds = [];

    // Get admin chat IDs (admins who have connected telegram)
    const admins = await User.find({ 
      role: 'admin', 
      telegramChatId: { $exists: true, $ne: null } 
    });

    adminChatIds = admins.map(admin => admin.telegramChatId);

    if (!adminChatIds.length) {
      console.warn('⚠️ No admin telegram connections found — admin notifications will be skipped');
      // Do not return early — continue to process customer notifications (ticket replies/resolutions)
    }

    switch (type) {
      case 'TICKET_CREATED':
        notificationMessage = `
🎫 *NEW SUPPORT TICKET*

*ID:* \`${ticket.ticketId}\`
*Subject:* ${ticket.subject}
*Priority:* ${getPriorityEmoji(ticket.priority)} ${ticket.priority}
*Category:* ${ticket.category}
*From:* ${userName}
*Status:* ${getStatusEmoji(ticket.status)} ${ticket.status}

👉 [View Ticket](${process.env.BACKEND_URL}/admin/tickets/${ticket._id})
`;
        break;

      case 'TICKET_MESSAGE':
        notificationMessage = `
💬 *NEW MESSAGE ON TICKET*

*ID:* \`${ticket.ticketId}\`
*From:* ${userName}
*Message:* ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}

👉 [Reply](${process.env.BACKEND_URL}/admin/tickets/${ticket._id})
`;
        break;

      case 'TICKET_REPLIED_ADMIN':
        // Notify customer if they have telegram connected, or if ticket has a telegramChatId stored
        if (ticket.userId) {
          const user = await User.findById(ticket.userId);
          if (user?.telegramChatId) {
            try {
              const customerMessage = `\n✉️ *SUPPORT TEAM REPLIED*\n\n*Ticket:* \`${ticket.ticketId}\`\n*From:* ${adminName || 'Support Team'}\n*Message:* ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}\n\n👉 [View Response](${process.env.FRONTEND_URL}/helpdesk/${ticket._id})\n`;
              await bot.sendMessage(user.telegramChatId, customerMessage, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
              });
              console.log(`✅ Telegram notification sent to customer`);
            } catch (err) {
              console.error('Error sending customer notification:', err.message);
            }
          }
        } else if (ticket.telegramChatId) {
          try {
            const customerMessage = `\n✉️ *SUPPORT TEAM REPLIED*\n\n*Ticket:* \`${ticket.ticketId}\`\n*From:* ${adminName || 'Support Team'}\n*Message:* ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}\n\n👉 [View Response](${process.env.FRONTEND_URL}/helpdesk/${ticket._id})\n`;
            await bot.sendMessage(ticket.telegramChatId, customerMessage, {
              parse_mode: 'Markdown',
              disable_web_page_preview: true
            });
            console.log(`✅ Telegram notification sent to ticket chatId`);
          } catch (err) {
            console.error('Error sending customer notification to telegramChatId:', err.message);
          }
        }
        return true;

      case 'TICKET_RESOLVED':
        notificationMessage = `
✅ *TICKET RESOLVED*

*ID:* \`${ticket.ticketId}\`
*Subject:* ${ticket.subject}
*Resolution:* ${resolutionNote || 'Resolved by support team'}

👉 [View Details](${process.env.BACKEND_URL}/admin/tickets/${ticket._id})
`;
        // Also notify customer (user-linked or by saved telegramChatId)
        if (ticket.userId) {
          const user = await User.findById(ticket.userId);
          if (user?.telegramChatId) {
            try {
              const customerMessage = `\n✅ *YOUR SUPPORT TICKET IS RESOLVED*\n\n*Ticket:* \`${ticket.ticketId}\`\n*Resolution:* ${resolutionNote || 'Your issue has been resolved'}\n\nPlease rate your support experience: \n👉 [Rate Now](${process.env.FRONTEND_URL}/helpdesk/${ticket._id}/rate)\n`;
              await bot.sendMessage(user.telegramChatId, customerMessage, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
              });
            } catch (err) {
              console.error('Error sending resolution notification:', err.message);
            }
          }
        } else if (ticket.telegramChatId) {
          try {
            const customerMessage = `\n✅ *YOUR SUPPORT TICKET IS RESOLVED*\n\n*Ticket:* \`${ticket.ticketId}\`\n*Resolution:* ${resolutionNote || 'Your issue has been resolved'}\n\nPlease rate your support experience: \n👉 [Rate Now](${process.env.FRONTEND_URL}/helpdesk/${ticket._id}/rate)\n`;
            await bot.sendMessage(ticket.telegramChatId, customerMessage, {
              parse_mode: 'Markdown',
              disable_web_page_preview: true
            });
          } catch (err) {
            console.error('Error sending resolution notification to telegramChatId:', err.message);
          }
        }
        break;

      case 'TICKET_ESCALATED':
        notificationMessage = `
⚠️ *TICKET ESCALATED*

*ID:* \`${ticket.ticketId}\`
*Subject:* ${ticket.subject}
*Reason:* ${reason || 'Escalated to high priority'}
*Priority:* 🔴 URGENT

👉 [Immediate Action Required](${process.env.BACKEND_URL}/admin/tickets/${ticket._id})
`;
        break;

      case 'TICKET_ASSIGNED':
        notificationMessage = `
📌 *TICKET ASSIGNED TO YOU*

*ID:* \`${ticket.ticketId}\`
*Subject:* ${ticket.subject}
*Priority:* ${getPriorityEmoji(ticket.priority)} ${ticket.priority}
*Customer:* ${userName}

👉 [Start Working](${process.env.BACKEND_URL}/admin/tickets/${ticket._id})
`;
        break;

      default:
        return false;
    }

    // Send to all admin telegram connections
    for (const chatId of adminChatIds) {
      try {
        await bot.sendMessage(chatId, notificationMessage, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
      } catch (err) {
        console.error(`Error sending to admin ${chatId}:`, err.message);
      }
    }

    console.log(`✅ Telegram notification sent: ${type}`);
    return true;
  } catch (error) {
    console.error('❌ Telegram notification error:', error.message);
    return false;
  }
};

/**
 * Helper function to get priority emoji
 */
const getPriorityEmoji = (priority) => {
  const emojis = {
    'LOW': '🟢',
    'MEDIUM': '🟡',
    'HIGH': '🟠',
    'URGENT': '🔴'
  };
  return emojis[priority] || '⚪';
};

/**
 * Helper function to get status emoji
 */
const getStatusEmoji = (status) => {
  const emojis = {
    'OPEN': '📖',
    'IN_PROGRESS': '⏳',
    'WAITING_CUSTOMER': '⏸️',
    'WAITING_MERCHANT': '⏸️',
    'RESOLVED': '✅',
    'CLOSED': '🔒',
    'REOPENED': '🔄'
  };
  return emojis[status] || '•';
};

/**
 * Send daily summary to admins
 */
const sendDailySummary = async () => {
  try {
    const Ticket = require('../models/ticketModel');
    const bot = require('./telegramBot').bot;

    if (!bot) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } }
        }
      }
    ]);

    const summary = stats[0] || { total: 0, open: 0, resolved: 0 };

    const message = `
📊 *DAILY TICKET SUMMARY*

*Date:* ${today.toLocaleDateString()}

📈 *Statistics:*
• Total Tickets: ${summary.total}
• Open: 📖 ${summary.open}
• Resolved: ✅ ${summary.resolved}
• Pending: ⏳ ${summary.total - summary.resolved}

👉 [View Dashboard](${process.env.BACKEND_URL}/admin/dashboard)
`;

    const admins = await User.find({ 
      role: 'admin', 
      telegramChatId: { $exists: true, $ne: null } 
    });

    for (const admin of admins) {
      try {
        await bot.sendMessage(admin.telegramChatId, message, {
          parse_mode: 'Markdown'
        });
      } catch (err) {
        console.error(`Error sending summary to ${admin._id}:`, err.message);
      }
    }

    console.log('✅ Daily summary sent to admins');
    return true;
  } catch (error) {
    console.error('❌ Daily summary error:', error.message);
    return false;
  }
};

module.exports = {
  sendTicketNotification,
  sendDailySummary
};
