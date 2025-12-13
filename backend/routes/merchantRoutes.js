const express = require('express');
const router = express.Router();
const { 
  submitRequest, 
  getRequests, 
  approveRequest, 
  rejectRequest 
} = require('../controllers/merchantController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

// Public route - submit merchant request
router.post('/request', submitRequest);

// Admin only routes
router.get('/requests', isAuthenticatedUser, authorizeRoles('admin'), getRequests);
router.post('/approve/:id', isAuthenticatedUser, authorizeRoles('admin'), approveRequest);
router.post('/reject/:id', isAuthenticatedUser, authorizeRoles('admin'), rejectRequest);

module.exports = router;
