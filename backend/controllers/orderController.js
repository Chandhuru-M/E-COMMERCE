// const catchAsyncError = require('../middlewares/catchAsyncError');
// const Order = require('../models/orderModel');
// const Product = require('../models/productModel');
// const ErrorHandler = require('../utils/errorHandler');
// //Create New Order - api/v1/order/new
// exports.newOrder =  catchAsyncError( async (req, res, next) => {
//     const {
//         orderItems,
//         shippingInfo,
//         itemsPrice,
//         taxPrice,
//         shippingPrice,
//         totalPrice,
//         paymentInfo
//     } = req.body;

//     const order = await Order.create({
//         orderItems,
//         shippingInfo,
//         itemsPrice,
//         taxPrice,
//         shippingPrice,
//         totalPrice,
//         paymentInfo,
//         paidAt: Date.now(),
//         user: req.user.id
//     })

//     res.status(200).json({
//         success: true,
//         order
//     })
// })

// //Get Single Order - api/v1/order/:id
// exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
//     const order = await Order.findById(req.params.id).populate('user', 'name email');
//     if(!order) {
//         return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
//     }

//     res.status(200).json({
//         success: true,
//         order
//     })
// })

// //Get Loggedin User Orders - /api/v1/myorders
// exports.myOrders = catchAsyncError(async (req, res, next) => {
//     const orders = await Order.find({user: req.user.id});

//     res.status(200).json({
//         success: true,
//         orders
//     })
// })

// //Admin: Get All Orders - api/v1/orders
// exports.orders = catchAsyncError(async (req, res, next) => {
//     const orders = await Order.find();

//     let totalAmount = 0;

//     orders.forEach(order => {
//         totalAmount += order.totalPrice
//     })

//     res.status(200).json({
//         success: true,
//         totalAmount,
//         orders
//     })
// })

// //Admin: Update Order / Order Status - api/v1/order/:id
// exports.updateOrder =  catchAsyncError(async (req, res, next) => {
//     const order = await Order.findById(req.params.id);

//     if(order.orderStatus == 'Delivered') {
//         return next(new ErrorHandler('Order has been already delivered!', 400))
//     }
//     //Updating the product stock of each order item
//     order.orderItems.forEach(async orderItem => {
//         await updateStock(orderItem.product, orderItem.quantity)
//     })

//     order.orderStatus = req.body.orderStatus;
//     order.deliveredAt = Date.now();
//     await order.save();

//     res.status(200).json({
//         success: true
//     })
    
// });

// async function updateStock (productId, quantity){
//     const product = await Product.findById(productId);
//     product.stock = product.stock - quantity;
//     product.save({validateBeforeSave: false})
// }

// //Admin: Delete Order - api/v1/order/:id
// exports.deleteOrder = catchAsyncError(async (req, res, next) => {
//     const order = await Order.findById(req.params.id);
//     if(!order) {
//         return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
//     }

//     await order.remove();
//     res.status(200).json({
//         success: true
//     })
// })

const catchAsyncError = require('../middlewares/catchAsyncError');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
//Create New Order - api/v1/order/new
exports.newOrder =  catchAsyncError( async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo
    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user.id
    })

    res.status(200).json({
        success: true,
        order
    })
})

//Get Single Order - api/v1/order/:id
exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if(!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    res.status(200).json({
        success: true,
        order
    })
})

//Get Loggedin User Orders - /api/v1/myorders
exports.myOrders = catchAsyncError(async (req, res, next) => {
    const orders = await Order.find({user: req.user.id});

    res.status(200).json({
        success: true,
        orders
    })
})

//Admin: Get All Orders - api/v1/orders (supports merchantId filter)
exports.orders = catchAsyncError(async (req, res, next) => {
    let query = {};
    
    // Support filtering by merchantId for merchant dashboard
    if (req.query.merchantId) {
        query.merchantId = req.query.merchantId;
    }
    
    const orders = await Order.find(query).populate('user', 'name email').sort({ createdAt: -1 });

    let totalAmount = 0;

    orders.forEach(order => {
        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
})

//Admin: Update Order / Order Status - api/v1/order/:id
exports.updateOrder =  catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if(order.orderStatus == 'Delivered') {
        return next(new ErrorHandler('Order has been already delivered!', 400))
    }
    //Updating the product stock of each order item
    order.orderItems.forEach(async orderItem => {
        await updateStock(orderItem.product, orderItem.quantity)
    })

    order.orderStatus = req.body.orderStatus;
    order.deliveredAt = Date.now();
    await order.save();

    res.status(200).json({
        success: true
    })
    
});

async function updateStock (productId, quantity){
    const product = await Product.findById(productId);
    product.stock = product.stock - quantity;
    product.save({validateBeforeSave: false})
}

//Admin: Delete Order - api/v1/order/:id
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if(!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    await order.deleteOne();
    res.status(200).json({
        success: true
    })
})
// Track Order - /api/v1/track/:id
exports.trackOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }

    res.status(200).json({
        success: true,
        tracking: {
            status: order.deliveryStatus || order.orderStatus,
            estimatedDelivery: order.estimatedDelivery || null
        }
    });
});
// Track Order - /api/v1/track/:id
exports.giveFeedback = catchAsyncError(async (req, res, next) => {
    const { rating, comment } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return next(new ErrorHandler("Order not found", 404));

    order.feedback = {
        rating,
        comment,
        submittedAt: new Date()
    };

    await order.save();

    res.status(200).json({
        success: true,
        message: "Feedback submitted successfully"
    });
});

exports.requestReturn = catchAsyncError(async (req, res, next) => {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return next(new ErrorHandler("Order not found", 404));

    order.returnRequested = true;
    order.returnReason = reason;
    order.returnStatus = "Requested";

    await order.save();

    res.status(200).json({
        success: true,
        message: "Return request submitted"
    });
});

exports.reportIssue = catchAsyncError(async (req, res, next) => {
    const { issueType, issueDescription } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return next(new ErrorHandler("Order not found", 404));

    order.issueType = issueType;
    order.issueDescription = issueDescription;
    order.issueStatus = "Open";

    await order.save();

    res.status(200).json({
        success: true,
        message: "Issue reported successfully"
    });
});