
// import { useElements, useStripe } from "@stripe/react-stripe-js";
// import { CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
// import axios from "axios";
// import { useEffect } from "react";
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { toast } from "react-toastify";
// import { orderCompleted } from "../../slices/cartSlice";
// import { validateShipping } from '../cart/Shipping';
// import { createOrder } from '../../actions/orderActions';
// import { clearError as clearOrderError } from "../../slices/orderSlice";

// export default function Payment() {

//     const stripe = useStripe();
//     const elements = useElements();
//     const dispatch = useDispatch();
//     const navigate = useNavigate();

//     const orderInfo = JSON.parse(sessionStorage.getItem('orderInfo'));
//     const { user } = useSelector(state => state.authState);
//     const { items: cartItems, shippingInfo } = useSelector(state => state.cartState);
//     const { error: orderError } = useSelector(state => state.orderState);

//     const order = {
//         orderItems: cartItems,
//         shippingInfo
//     };

//     if (orderInfo) {
//         order.itemsPrice = orderInfo.itemsPrice;
//         order.shippingPrice = orderInfo.shippingPrice;
//         order.taxPrice = orderInfo.taxPrice;
//         order.totalPrice = orderInfo.totalPrice;
//     }

//     useEffect(() => {
//         validateShipping(shippingInfo, navigate);
//         if (orderError) {
//             toast(orderError, {
//                 position: toast.POSITION.BOTTOM_CENTER,
//                 type: 'error',
//                 onOpen: () => dispatch(clearOrderError())
//             });
//         }
//     }, []);

//     // ⭐ MERGED — Payment Agent integrated here
//     const submitHandler = async (e) => {
//         e.preventDefault();
//         document.querySelector('#pay_btn').disabled = true;

//         try {

//             // ⭐ NEW — Call Payment Agent instead of /payment/process
//             const { data } = await axios.post("/api/v1/start-payment", {
//                 amount: orderInfo.totalPrice,
//                 currency: "inr",
//                 user,
//                 orderDetails: {
//                     orderId: "TEMP_ORDER_ID",
//                     productName: cartItems[0]?.name || "Order Items"
//                 }
//             });

//             const clientSecret = data.clientSecret;

//             // ⭐ Confirm card payment
//             const result = await stripe.confirmCardPayment(clientSecret, {
//                 payment_method: {
//                     card: elements.getElement(CardNumberElement),
//                     billing_details: {
//                         name: user.name,
//                         email: user.email
//                     }
//                 }
//             });

//             // ⭐ Error handling
//             if (result.error) {
//                 toast(result.error.message, {
//                     type: 'error',
//                     position: toast.POSITION.BOTTOM_CENTER
//                 });
//                 document.querySelector('#pay_btn').disabled = false;
//                 return;
//             }

//             // ⭐ SUCCESS CASE
//             if (result.paymentIntent.status === "succeeded") {
//                 toast("Payment Success!", {
//                     type: "success",
//                     position: toast.POSITION.BOTTOM_CENTER
//                 });

//                 order.paymentInfo = {
//                     id: result.paymentIntent.id,
//                     status: result.paymentIntent.status
//                 };

//                 dispatch(orderCompleted());
//                 dispatch(createOrder(order));

//                 navigate('/order/success');
//             } else {
//                 toast("Payment failed. Try again!", {
//                     type: "warning",
//                     position: toast.POSITION.BOTTOM_CENTER
//                 });
//                 document.querySelector('#pay_btn').disabled = false;
//             }

//         } catch (error) {
//             console.log(error);
//             toast("Payment Error!", {
//                 type: "error",
//                 position: toast.POSITION.BOTTOM_CENTER
//             });
//             document.querySelector('#pay_btn').disabled = false;
//         }
//     };

//     return (
//         <div className="row wrapper">
//             <div className="col-10 col-lg-5">
//                 <form onSubmit={submitHandler} className="shadow-lg">
//                     <h1 className="mb-4">Card Info</h1>

//                     <div className="form-group">
//                         <label htmlFor="card_num_field">Card Number</label>
//                         <CardNumberElement id="card_num_field" className="form-control" />
//                     </div>

//                     <div className="form-group">
//                         <label htmlFor="card_exp_field">Card Expiry</label>
//                         <CardExpiryElement id="card_exp_field" className="form-control" />
//                     </div>

//                     <div className="form-group">
//                         <label htmlFor="card_cvc_field">Card CVC</label>
//                         <CardCvcElement id="card_cvc_field" className="form-control" />
//                     </div>

//                     <button id="pay_btn" type="submit" className="btn btn-block py-3">
//                         Pay - ₹{orderInfo && orderInfo.totalPrice}
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// }

import React, { useEffect, useState } from "react";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import { CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { orderCompleted } from "../../slices/cartSlice";
import { validateShipping } from "../cart/Shipping";

export default function Payment() {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const orderInfo = JSON.parse(sessionStorage.getItem("orderInfo"));
  const { user } = useSelector((state) => state.authState);
  const { items: cartItems, shippingInfo } = useSelector((state) => state.cartState);
  const { error: orderError } = useSelector((state) => state.orderState);

  // loyalty + totals states
  const [userPoints, setUserPoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [useSuggested, setUseSuggested] = useState(true);
  const [suggestedPoints, setSuggestedPoints] = useState(0);

  const [subTotals, setSubTotals] = useState({
    subtotalRaw: 0, // before discount
    subtotalAfterDiscount: 0,
    discountTotal: 0,
    shipping: Number(orderInfo?.shippingPrice) || 0,
    tax: Number(orderInfo?.taxPrice) || 0,
    totalPayable: Number(orderInfo?.totalPrice) || 0
  });

  // helper: compute discount (static 10%)
  const computeDiscounts = () => {
    const discountPercent = 10; // static D1
    let subtotalRaw = 0;
    let subtotalAfterDiscount = 0;
    let discountTotal = 0;

    cartItems.forEach((it) => {
      const qty = it.quantity || 1;
      const basePrice = Number(it.price || 0);
      subtotalRaw += basePrice * qty;
      const unitDiscount = +(basePrice * (discountPercent / 100)).toFixed(2);
      const unitFinal = +(basePrice - unitDiscount).toFixed(2);
      subtotalAfterDiscount += unitFinal * qty;
      discountTotal += unitDiscount * qty;
    });

    subtotalRaw = +subtotalRaw.toFixed(2);
    subtotalAfterDiscount = +subtotalAfterDiscount.toFixed(2);
    discountTotal = +discountTotal.toFixed(2);

    return { subtotalRaw, subtotalAfterDiscount, discountTotal };
  };

  useEffect(() => {
    validateShipping(shippingInfo, navigate);
    // compute discounts locally
    const { subtotalRaw, subtotalAfterDiscount, discountTotal } = computeDiscounts();

    // suggested points will be integer rupees only
    const suggested = Math.floor(subtotalAfterDiscount); // max possible if user has enough points

    setSubTotals((s) => ({
      ...s,
      subtotalRaw,
      subtotalAfterDiscount,
      discountTotal,
      shipping: Number(orderInfo?.shippingPrice) || 0,
      tax: Number(orderInfo?.taxPrice) || 0
    }));

    // fetch user loyalty points
    (async () => {
      try {
        const res = await axios.get("/api/v1/loyalty/check", { withCredentials: true });
        const pts = res.data.loyaltyPoints || 0;
        setUserPoints(pts);
        const suggestedPts = Math.min(pts, suggested);
        setSuggestedPoints(suggestedPts);
        setPointsToUse(suggestedPts); // by default use suggested
        setUseSuggested(true);
      } catch (err) {
        // if user not logged in or endpoint fails, default 0
        setUserPoints(0);
        setSuggestedPoints(0);
        setPointsToUse(0);
        setUseSuggested(false);
        // no error toast needed; treat as guest (no loyalty)
      }
    })();

    if (orderError) {
      toast(orderError, { position: toast.POSITION.BOTTOM_CENTER, type: "error" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recompute payable whenever pointsToUse or subtotals change
  useEffect(() => {
    const totalAfterPoints = Math.max(0, +((subTotals.subtotalAfterDiscount || 0) - (pointsToUse || 0)).toFixed(2));
    const totalPayable = +(totalAfterPoints + (subTotals.shipping || 0) + (subTotals.tax || 0)).toFixed(2);
    setSubTotals((s) => ({ ...s, totalPayable }));
  }, [pointsToUse, subTotals.subtotalAfterDiscount, subTotals.shipping, subTotals.tax]);

  const onPointsChange = (value) => {
    const val = Number(value) || 0;
    const maxAllowed = Math.min(userPoints, Math.floor(subTotals.subtotalAfterDiscount));
    if (val < 0) return;
    if (val > maxAllowed) setPointsToUse(maxAllowed);
    else setPointsToUse(Math.floor(val));
    setUseSuggested(false);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    document.querySelector("#pay_btn").disabled = true;

    try {
      // final payable to charge
      const finalPayable = subTotals.totalPayable;

      // 1) Create PaymentIntent through your Payment Agent
      const paymentResp = await axios.post(
        "/api/v1/start-payment",
        {
          amount: finalPayable, // backend will convert to smallest unit
          currency: "inr",
          user: user || null,
          orderDetails: {
            productName: cartItems[0]?.name || "Order Items",
            itemsCount: cartItems.length
          }
        },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );

      const clientSecret = paymentResp.data.clientSecret;
      if (!clientSecret) throw new Error("Payment initialization failed");

      // 2) Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: user?.name || "Guest",
            email: user?.email || ""
          }
        }
      });

      if (result.error) {
        toast(result.error.message || "Payment failed", { type: "error", position: toast.POSITION.BOTTOM_CENTER });
        document.querySelector("#pay_btn").disabled = false;
        return;
      }

      if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        // Debug: Log cart items to see what data we have
        console.log("Cart Items:", cartItems);
        
        // Build order payload - ensure orderItems have all required fields
        const orderPayload = {
          orderItems: cartItems.map(item => ({
            name: item.name || "Product",
            quantity: item.quantity || 1,
            image: item.image || "",
            price: item.price || 0,
            product: item.product
          })),
          shippingInfo,
          itemsPrice: subTotals.subtotalRaw,
          taxPrice: subTotals.tax || 0,
          shippingPrice: subTotals.shipping || 0,
          totalPrice: subTotals.totalPayable,
          paymentInfo: {
            id: result.paymentIntent.id,
            status: result.paymentIntent.status
          },
          loyalty: {
            appliedPoints: pointsToUse || 0,
            // earned points calculated on amount after discounts but before loyalty redemption (or you may choose after)
            earnedPoints: Math.floor(((subTotals.subtotalAfterDiscount - (pointsToUse || 0)) || 0) / 10)
          }
        };

        // 3) Create order directly to backend to get order id
        const orderResp = await axios.post("/api/v1/order/new", orderPayload, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        });

        const createdOrder = orderResp.data.order;
        const orderId = createdOrder?._id;

        // 4) Finalize loyalty (deduct and award) - backend is authoritative
        if (orderId) {
          await axios.post(
            "/api/v1/loyalty/finalize",
            { orderId, pointsUsed: pointsToUse || 0 },
            { withCredentials: true }
          );
        }

        // 5) update frontend store and navigate
        dispatch(orderCompleted());
        toast("Payment & Order successful!", { type: "success", position: toast.POSITION.BOTTOM_CENTER });
        navigate("/order/success");
      } else {
        toast("Payment not completed. Try again.", { type: "warning", position: toast.POSITION.BOTTOM_CENTER });
        document.querySelector("#pay_btn").disabled = false;
      }
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.message || err.message || "Payment error", {
        type: "error",
        position: toast.POSITION.BOTTOM_CENTER
      });
      document.querySelector("#pay_btn").disabled = false;
    }
  };

  // UI small helpers
  const { subtotalRaw, subtotalAfterDiscount, discountTotal, shipping, tax, totalPayable } = subTotals;
  const maxRedeemable = Math.min(userPoints, Math.floor(subtotalAfterDiscount));

  return (
    <div className="row wrapper">
      <div className="col-10 col-lg-7">
        <form onSubmit={submitHandler} className="shadow-lg p-3">
          <h2 className="mb-3">Payment Summary</h2>

          <div className="mb-2">
            <strong>Subtotal (original):</strong> ₹{subtotalRaw.toFixed(2)}
          </div>
          <div className="mb-2">
            <strong>Static discount (10%):</strong> - ₹{discountTotal.toFixed(2)}
          </div>
          <div className="mb-2">
            <strong>Subtotal after discount:</strong> ₹{subtotalAfterDiscount.toFixed(2)}
          </div>

          <hr />

          <div className="mb-2">
            <strong>Your Loyalty Points:</strong> {userPoints}
            {userPoints > 0 && (
              <span className="text-muted"> (₹{userPoints} value)</span>
            )}
          </div>

          <div className="form-group mb-2">
            <label>Use points (max {maxRedeemable})</label>
            <div className="d-flex align-items-center">
              <input
                type="number"
                min="0"
                max={maxRedeemable}
                value={pointsToUse}
                onChange={(e) => onPointsChange(e.target.value)}
                className="form-control"
                style={{ width: 140, marginRight: 8 }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setPointsToUse(maxRedeemable);
                  setUseSuggested(true);
                }}
              >
                Use max suggested
              </button>
            </div>
            <small className="text-muted">Suggested points: {suggestedPoints}</small>
          </div>

          <div className="mb-2">
            <strong>Shipping:</strong> ₹{shipping.toFixed(2)}
          </div>
          <div className="mb-2">
            <strong>Tax:</strong> ₹{tax.toFixed(2)}
          </div>

          <hr />

          <div className="mb-3">
            <strong>Total after points:</strong> ₹{(+((subtotalAfterDiscount - (pointsToUse || 0)) || 0)).toFixed(2)}
          </div>

          <div className="mb-3">
            <strong>Final payable:</strong> ₹{totalPayable.toFixed(2)}
          </div>

          <h4 className="mb-3">Card Information</h4>

          <div className="form-group mb-2">
            <label htmlFor="card_num_field">Card Number</label>
            <CardNumberElement id="card_num_field" className="form-control" />
          </div>

          <div className="form-row d-flex">
            <div className="form-group col-6 me-2">
              <label htmlFor="card_exp_field">Card Expiry</label>
              <CardExpiryElement id="card_exp_field" className="form-control" />
            </div>

            <div className="form-group col-6">
              <label htmlFor="card_cvc_field">Card CVC</label>
              <CardCvcElement id="card_cvc_field" className="form-control" />
            </div>
          </div>

          <button id="pay_btn" type="submit" className="btn btn-primary btn-block py-3 mt-3">
            Pay - ₹{totalPayable.toFixed(2)}
          </button>
        </form>
      </div>

      <div className="col-10 col-lg-4">
        <div className="shadow-lg p-3">
          <h4>Order details</h4>
          {cartItems.map((it) => (
            <div key={it.product} className="mb-2 d-flex justify-content-between">
              <div>
                <div>{it.name}</div>
                <small className="text-muted">qty: {it.quantity}</small>
              </div>
              <div>₹{(it.price * it.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}