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
const express = require('express');
const router = express.Router();
const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/authenticate');
const { 
    newOrder,
    getSingleOrder,
    myOrders,
    orders,
    updateOrder,
    deleteOrder,
    trackOrder,
    giveFeedback,
    requestReturn,
    reportIssue
} = require('../controllers/orderController');

router.route('/order/:id/feedback')
    .post(isAuthenticatedUser, giveFeedback);

router.route('/order/:id/return')
    .post(isAuthenticatedUser, requestReturn);

router.route('/order/:id/issue')
    .post(isAuthenticatedUser, reportIssue);


router.route('/order/new').post(isAuthenticatedUser,newOrder);
router.route('/order/:id').get(isAuthenticatedUser,getSingleOrder);
router.route('/myorders').get(isAuthenticatedUser,myOrders);
router.route('/track/:id').get(isAuthenticatedUser, trackOrder);

// Orders route for merchant dashboard (with merchantId filter support)
router.route('/orders').get(isAuthenticatedUser, orders);

//Admin Routes
router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles('admin'), orders)
router.route('/admin/order/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
                        .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder)

module.exports = router;