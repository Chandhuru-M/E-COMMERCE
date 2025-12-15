const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const {
  createTicket,
  getMyTickets,
  getTicketDetail,
  addMessage,
  closeTicket,
  getFAQ,
  markFAQHelpful
} = require('../controllers/ticketController');

const {
  getAllTickets,
  getTicketFullDetail,
  assignTicket,
  addAdminReply,
  resolveTicket,
  getAnalytics,
  getStaffMetrics,
  escalateTicket,
  createFAQ,
  updateFAQ,
  deleteFAQ
} = require('../controllers/adminTicketController');

// ========================
// USER/MERCHANT ROUTES
// ========================

// Create ticket
router.post('/ticket/create', isAuthenticatedUser, createTicket);

// Get my tickets
router.get('/my-tickets', isAuthenticatedUser, getMyTickets);

// Get ticket detail
router.get('/ticket/:ticketId', isAuthenticatedUser, getTicketDetail);

// Add message to ticket
router.post('/ticket/:ticketId/message', isAuthenticatedUser, addMessage);

// Close/Rate ticket
router.put('/ticket/:ticketId/close', isAuthenticatedUser, closeTicket);

// Get FAQ
router.get('/faq', getFAQ);

// Mark FAQ as helpful
router.post('/faq/:faqId/helpful', markFAQHelpful);

// ========================
// ADMIN ROUTES
// ========================

// Get all tickets
router.get('/admin/tickets', isAuthenticatedUser, authorizeRoles('admin'), getAllTickets);

// Get ticket full details
router.get('/admin/ticket/:ticketId', isAuthenticatedUser, authorizeRoles('admin'), getTicketFullDetail);

// Assign ticket
router.put('/admin/ticket/:ticketId/assign', isAuthenticatedUser, authorizeRoles('admin'), assignTicket);

// Add admin reply
router.post('/admin/ticket/:ticketId/reply', isAuthenticatedUser, authorizeRoles('admin'), addAdminReply);

// Resolve ticket
router.put('/admin/ticket/:ticketId/resolve', isAuthenticatedUser, authorizeRoles('admin'), resolveTicket);

// Escalate ticket
router.put('/admin/ticket/:ticketId/escalate', isAuthenticatedUser, authorizeRoles('admin'), escalateTicket);

// Get analytics
router.get('/admin/analytics', isAuthenticatedUser, authorizeRoles('admin'), getAnalytics);

// Get staff metrics
router.get('/admin/staff-metrics', isAuthenticatedUser, authorizeRoles('admin'), getStaffMetrics);

// FAQ Management
router.post('/admin/faq', isAuthenticatedUser, authorizeRoles('admin'), createFAQ);
router.put('/admin/faq/:faqId', isAuthenticatedUser, authorizeRoles('admin'), updateFAQ);
router.delete('/admin/faq/:faqId', isAuthenticatedUser, authorizeRoles('admin'), deleteFAQ);

module.exports = router;
