const nodemailer = require('nodemailer');
const path = require('path');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates
const emailTemplates = {
  TICKET_CREATED: (ticket, userName) => ({
    subject: `Support Ticket Created: ${ticket.ticketId}`,
    html: `
      <h2>Ticket Created Successfully</h2>
      <p>Hi ${userName},</p>
      <p>Your support ticket has been created and assigned a reference number.</p>
      <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50;">
        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
        <p><strong>Category:</strong> ${ticket.category}</p>
      </div>
      <p>Our support team will review your ticket shortly. You'll receive updates via email.</p>
      <p>Track your ticket: <a href="${process.env.FRONTEND_URL}/helpdesk/${ticket._id}">View Ticket</a></p>
      <hr/>
      <p style="color: #666; font-size: 12px;">Reference: ${ticket.ticketId}</p>
    `
  }),

  TICKET_ASSIGNED: (ticket, staffName) => ({
    subject: `New Ticket Assigned: ${ticket.ticketId}`,
    html: `
      <h2>Ticket Assigned to You</h2>
      <p>Hi ${staffName},</p>
      <p>A new support ticket has been assigned to you.</p>
      <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #2196F3;">
        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Customer:</strong> ${ticket.userId?.name || ticket.merchantId?.shopName || 'Unknown'}</p>
      </div>
      <p>Review and respond to this ticket: <a href="${process.env.BACKEND_URL}/admin/tickets/${ticket._id}">Open Ticket</a></p>
    `
  }),

  TICKET_MESSAGE: (ticket, userName, message) => ({
    subject: `New Message on Ticket: ${ticket.ticketId}`,
    html: `
      <h2>New Message from ${userName}</h2>
      <p>There's a new message on ticket <strong>${ticket.ticketId}</strong></p>
      <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0;">
        <p><strong>${userName} wrote:</strong></p>
        <p>${message.substring(0, 500)}${message.length > 500 ? '...' : ''}</p>
      </div>
      <p><a href="${process.env.FRONTEND_URL}/helpdesk/${ticket._id}">View Full Conversation</a></p>
    `
  }),

  TICKET_REPLIED: (ticket, userName, message) => ({
    subject: `Support Team Reply: ${ticket.ticketId}`,
    html: `
      <h2>Support Team Response</h2>
      <p>Hi ${userName},</p>
      <p>The support team has replied to your ticket <strong>${ticket.ticketId}</strong>.</p>
      <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
        <p>${message.substring(0, 500)}${message.length > 500 ? '...' : ''}</p>
      </div>
      <p><a href="${process.env.FRONTEND_URL}/helpdesk/${ticket._id}">View Full Response</a></p>
    `
  }),

  TICKET_RESOLVED: (ticket, userName, resolutionNote) => ({
    subject: `Ticket Resolved: ${ticket.ticketId}`,
    html: `
      <h2>Ticket Resolved</h2>
      <p>Hi ${userName},</p>
      <p>Your support ticket <strong>${ticket.ticketId}</strong> has been resolved.</p>
      <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
        <p><strong>Resolution:</strong></p>
        <p>${resolutionNote || 'Your issue has been addressed by our support team.'}</p>
      </div>
      <p>Please provide feedback on your support experience: <a href="${process.env.FRONTEND_URL}/helpdesk/${ticket._id}/rate">Rate Support</a></p>
    `
  }),

  TICKET_CLOSED: (ticket, userName, satisfactionScore) => ({
    subject: `Ticket Closed: ${ticket.ticketId}`,
    html: `
      <h2>Ticket Closed</h2>
      <p>Hi ${userName},</p>
      <p>Your support ticket <strong>${ticket.ticketId}</strong> has been closed.</p>
      <p style="color: #666;">If you need further assistance, you can always create a new ticket.</p>
      <p>Thank you for choosing us!</p>
    `
  })
};

/**
 * Send ticket-related emails
 */
const sendTicketEmail = async ({
  to,
  type,
  ticket,
  userName,
  message,
  staffName,
  resolutionNote,
  satisfactionScore
}) => {
  try {
    if (!to || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email configuration incomplete - skipping email');
      return false;
    }

    let emailContent;

    switch (type) {
      case 'TICKET_CREATED':
        emailContent = emailTemplates.TICKET_CREATED(ticket, userName);
        break;
      case 'TICKET_ASSIGNED':
        emailContent = emailTemplates.TICKET_ASSIGNED(ticket, staffName);
        break;
      case 'TICKET_MESSAGE':
        emailContent = emailTemplates.TICKET_MESSAGE(ticket, userName, message);
        break;
      case 'TICKET_REPLIED':
        emailContent = emailTemplates.TICKET_REPLIED(ticket, userName, message);
        break;
      case 'TICKET_RESOLVED':
        emailContent = emailTemplates.TICKET_RESOLVED(ticket, userName, resolutionNote);
        break;
      case 'TICKET_CLOSED':
        emailContent = emailTemplates.TICKET_CLOSED(ticket, userName, satisfactionScore);
        break;
      default:
        return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${type} to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Email error (${type}):`, error.message);
    return false;
  }
};

/**
 * Send bulk emails
 */
const sendBulkEmails = async (recipients, subject, htmlContent) => {
  try {
    if (!recipients.length || !process.env.EMAIL_USER) {
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipients.join(','),
      subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Bulk email sent to ${recipients.length} recipients`);
    return true;
  } catch (error) {
    console.error('❌ Bulk email error:', error.message);
    return false;
  }
};

/**
 * Send notification email (internal use)
 */
const sendNotificationEmail = async (adminEmail, subject, message) => {
  try {
    if (!adminEmail || !process.env.EMAIL_USER) {
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmail,
      subject,
      html: `<h2>${subject}</h2><p>${message}</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification email sent to ${adminEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Notification email error:', error.message);
    return false;
  }
};

module.exports = {
  sendTicketEmail,
  sendBulkEmails,
  sendNotificationEmail,
  transporter
};
