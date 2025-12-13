// const express = require('express');
// const { newOrder, getSingleOrder, myOrders, orders, updateOrder, deleteOrder } = require('../controllers/orderController');
// const router = express.Router();
// const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/authenticate');

// router.route('/order/new').post(isAuthenticatedUser,newOrder);
// router.route('/order/:id').get(isAuthenticatedUser,getSingleOrder);
// router.route('/myorders').get(isAuthenticatedUser,myOrders);

// //Admin Routes
// router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles('admin'), orders)
// router.route('/admin/order/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
//                         .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder)

// module.exports = router;
// const express = require('express');
// const router = express.Router();
// const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/authenticate');
// const { 
//     newOrder,
//     getSingleOrder,
//     myOrders,
//     orders,
//     updateOrder,
//     deleteOrder,
//     trackOrder,
//     giveFeedback,
//     requestReturn,
//     reportIssue
// } = require('../controllers/orderController');

// router.route('/order/:id/feedback')
//     .post(isAuthenticatedUser, giveFeedback);

// router.route('/order/:id/return')
//     .post(isAuthenticatedUser, requestReturn);

// router.route('/order/:id/issue')
//     .post(isAuthenticatedUser, reportIssue);


// router.route('/order/new').post(isAuthenticatedUser,newOrder);
// router.route('/order/:id').get(isAuthenticatedUser,getSingleOrder);
// router.route('/myorders').get(isAuthenticatedUser,myOrders);
// router.route('/track/:id').get(isAuthenticatedUser, trackOrder);


// //Admin Routes
// router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles('admin'), orders)
// router.route('/admin/order/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
//                         .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder)

// module.exports = router;



// routes/order.js
// const express = require('express');
// const router = express.Router();
// const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
// const {
//   newOrder,
//   getSingleOrder,
//   myOrders,
//   orders,
//   updateOrder,
//   deleteOrder,
//   trackOrder,
//   giveFeedback,
//   requestReturn,
//   reportIssue,
// } = require('../controllers/orderController');

// /*
//   Post-purchase actions:
//   - Keep both legacy simple routes and the /postpurchase/* namespace
//   - Accept POST and PUT to maximize compatibility with clients
// */

// // Legacy-style routes (kept for compatibility)
// router.route('/order/:id/feedback')
//   .post(isAuthenticatedUser, giveFeedback)
//   .put(isAuthenticatedUser, giveFeedback);

// router.route('/order/:id/return')
//   .post(isAuthenticatedUser, requestReturn)
//   .put(isAuthenticatedUser, requestReturn);

// router.route('/order/:id/issue')
//   .post(isAuthenticatedUser, reportIssue)
//   .put(isAuthenticatedUser, reportIssue);

// // New namespaced post-purchase routes
// router.route('/postpurchase/feedback/:id')
//   .post(isAuthenticatedUser, giveFeedback)
//   .put(isAuthenticatedUser, giveFeedback);

// router.route('/postpurchase/return/:id')
//   .post(isAuthenticatedUser, requestReturn)
//   .put(isAuthenticatedUser, requestReturn);

// router.route('/postpurchase/report-issue/:id')
//   .post(isAuthenticatedUser, reportIssue)
//   .put(isAuthenticatedUser, reportIssue);

// // Order creation / retrieval / tracking
// router.route('/order/new').post(isAuthenticatedUser, newOrder);
// router.route('/order/:id').get(isAuthenticatedUser, getSingleOrder);
// router.route('/myorders').get(isAuthenticatedUser, myOrders);
// router.route('/track/:id').get(isAuthenticatedUser, trackOrder);

// // Admin Routes
// router.route('/admin/orders')
//   .get(isAuthenticatedUser, authorizeRoles('admin'), orders);

// router.route('/admin/order/:id')
//   .put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
//   .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder);

// module.exports = router;


const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

const {
  newOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
  trackOrder,
  giveFeedback,
  requestReturn,
  reportIssue,
} = require("../controllers/orderController");

/*
  Post-purchase actions:
  - Keep both legacy simple routes and the /postpurchase/* namespace
*/

// Legacy routes
router.route('/order/:id/feedback')
  .post(isAuthenticatedUser, giveFeedback)
  .put(isAuthenticatedUser, giveFeedback);

router.route('/order/:id/return')
  .post(isAuthenticatedUser, requestReturn)
  .put(isAuthenticatedUser, requestReturn);

router.route('/order/:id/issue')
  .post(isAuthenticatedUser, reportIssue)
  .put(isAuthenticatedUser, reportIssue);

// Namespaced post-purchase routes
router.route('/postpurchase/feedback/:id')
  .post(isAuthenticatedUser, giveFeedback)
  .put(isAuthenticatedUser, giveFeedback);

router.route('/postpurchase/return/:id')
  .post(isAuthenticatedUser, requestReturn)
  .put(isAuthenticatedUser, requestReturn);

router.route('/postpurchase/report-issue/:id')
  .post(isAuthenticatedUser, reportIssue)
  .put(isAuthenticatedUser, reportIssue);

// Orders
router.route('/order/new').post(isAuthenticatedUser, newOrder);
router.route('/order/:id').get(isAuthenticatedUser, getSingleOrder);
router.route('/myorders').get(isAuthenticatedUser, myOrders);
router.route('/track/:id').get(isAuthenticatedUser, trackOrder);

// Admin
router.route("/admin/orders")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrders);

router.route('/admin/order/:id')
  .put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
  .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder);

module.exports = router;
