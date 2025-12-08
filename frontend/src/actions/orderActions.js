// import {adminOrdersFail, adminOrdersRequest, adminOrdersSuccess, createOrderFail, createOrderRequest, createOrderSuccess, deleteOrderFail, deleteOrderRequest, deleteOrderSuccess, orderDetailFail, orderDetailRequest, orderDetailSuccess, updateOrderFail, updateOrderRequest, updateOrderSuccess, userOrdersFail, userOrdersRequest, userOrdersSuccess } from '../slices/orderSlice';
// import axios from 'axios';

// export const createOrder = order => async(dispatch) => {
//     try {
//        dispatch(createOrderRequest())
//        const {data} = await axios.post(`/api/v1/order/new`, order)
//        dispatch(createOrderSuccess(data))
//     } catch (error) {
//         dispatch(createOrderFail(error.response.data.message))
//     }
// }
// export const userOrders = async(dispatch) => {
//     try {
//        dispatch(userOrdersRequest())
//        const {data} = await axios.get(`/api/v1/myorders`)
//        dispatch(userOrdersSuccess(data))
//     } catch (error) {
//         dispatch(userOrdersFail(error.response.data.message))
//     }
// }
// export const orderDetail = id => async(dispatch) => {
//     try {
//        dispatch(orderDetailRequest())
//        const {data} = await axios.get(`/api/v1/order/${id}`)
//        dispatch(orderDetailSuccess(data))
//     } catch (error) {
//         dispatch(orderDetailFail(error.response.data.message))
//     }
// }

// export const adminOrders = async(dispatch) => {
//     try {
//        dispatch(adminOrdersRequest())
//        const {data} = await axios.get(`/api/v1/admin/orders`)
//        dispatch(adminOrdersSuccess(data))
//     } catch (error) {
//         dispatch(adminOrdersFail(error.response.data.message))
//     }
// }

// export const deleteOrder = id => async(dispatch) => {
//     try {
//        dispatch(deleteOrderRequest())
//        await axios.delete(`/api/v1/admin/order/${id}`)
//        dispatch(deleteOrderSuccess())
//     } catch (error) {
//        dispatch(deleteOrderFail(error.response.data.message))
//     }
// }

// export const updateOrder = (id, orderData)  => async(dispatch) => {
//     try {
//        dispatch(updateOrderRequest())
//        const { data} = await axios.put(`/api/v1/admin/order/${id}`, orderData)
//        dispatch(updateOrderSuccess(data))
//     } catch (error) {
//        dispatch(updateOrderFail(error.response.data.message))
//     }
// }
import {
    adminOrdersFail,
    adminOrdersRequest,
    adminOrdersSuccess,
    createOrderFail,
    createOrderRequest,
    createOrderSuccess,
    deleteOrderFail,
    deleteOrderRequest,
    deleteOrderSuccess,
    orderDetailFail,
    orderDetailRequest,
    orderDetailSuccess,
    updateOrderFail,
    updateOrderRequest,
    updateOrderSuccess,
    userOrdersFail,
    userOrdersRequest,
    userOrdersSuccess
} from '../slices/orderSlice';

import axios from 'axios';

/* =====================================================
    ⭐ NEW — Loyalty Agent (10% static discount)
   ===================================================== */
export const applyStaticDiscount = (orderInfo) => {
    const discountPercentage = 10; // Option D1
    const discountAmount = (orderInfo.totalPrice * discountPercentage) / 100;

    const updatedOrder = {
        ...orderInfo,
        discount: discountAmount,
        totalPrice: orderInfo.totalPrice - discountAmount
    };

    return updatedOrder;
};

/* =====================================================
    ⭐ Create New Order
   ===================================================== */
export const createOrder = (order) => async (dispatch) => {
    try {
        dispatch(createOrderRequest());

        const { data } = await axios.post("/api/v1/order/new", order);

        dispatch(createOrderSuccess(data));
    } catch (error) {
        dispatch(createOrderFail(error.response?.data?.message || "Order Creation Failed"));
    }
};

/* =====================================================
    ⭐ Get Logged-in User Orders
   ===================================================== */
export const userOrders = () => async (dispatch) => {
    try {
        dispatch(userOrdersRequest());

        const { data } = await axios.get("/api/v1/myorders");

        dispatch(userOrdersSuccess(data));
    } catch (error) {
        dispatch(userOrdersFail(error.response?.data?.message || "Failed to load orders"));
    }
};

/* =====================================================
    ⭐ Get Order Details by ID
   ===================================================== */
export const orderDetail = (id) => async (dispatch) => {
    try {
        dispatch(orderDetailRequest());

        const { data } = await axios.get(`/api/v1/order/${id}`);

        dispatch(orderDetailSuccess(data));
    } catch (error) {
        dispatch(orderDetailFail(error.response?.data?.message || "Failed to load order"));
    }
};

/* =====================================================
    ⭐ Admin — Get All Orders
   ===================================================== */
export const adminOrders = () => async (dispatch) => {
    try {
        dispatch(adminOrdersRequest());

        const { data } = await axios.get("/api/v1/admin/orders");

        dispatch(adminOrdersSuccess(data));
    } catch (error) {
        dispatch(adminOrdersFail(error.response?.data?.message || "Failed to load admin orders"));
    }
};

/* =====================================================
    ⭐ Admin — Delete Order
   ===================================================== */
export const deleteOrder = (id) => async (dispatch) => {
    try {
        dispatch(deleteOrderRequest());

        await axios.delete(`/api/v1/admin/order/${id}`);

        dispatch(deleteOrderSuccess());
    } catch (error) {
        dispatch(deleteOrderFail(error.response?.data?.message || "Delete Failed"));
    }
};

/* =====================================================
    ⭐ Admin — Update Order
   ===================================================== */
export const updateOrder = (id, orderData) => async (dispatch) => {
    try {
        dispatch(updateOrderRequest());

        const { data } = await axios.put(`/api/v1/admin/order/${id}`, orderData);

        dispatch(updateOrderSuccess(data));
    } catch (error) {
        dispatch(updateOrderFail(error.response?.data?.message || "Update Failed"));
    }
};