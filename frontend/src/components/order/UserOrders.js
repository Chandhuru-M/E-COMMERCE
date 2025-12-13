
// import { Fragment, useEffect, useState } from 'react';
// import MetaData from '../layouts/MetaData';
// import { MDBDataTable } from 'mdbreact';
// import { useDispatch, useSelector } from 'react-redux';
// import { userOrders as userOrdersAction } from '../../actions/orderActions';
// import { Link } from 'react-router-dom';

// export default function UserOrders() {
//   const { userOrders = [] } = useSelector(state => state.orderState);
//   const dispatch = useDispatch();

//   const [showFeedback, setShowFeedback] = useState(false);
//   const [currentOrderId, setCurrentOrderId] = useState("");

//   useEffect(() => {
//     dispatch(userOrdersAction());
//   }, [dispatch]);

//   // ✅ Track Order
//   const trackOrder = async (orderId) => {
//     const res = await fetch(
//       `http://localhost:3001/api/v1/fulfillment/track/${orderId}`
//     );
//     const data = await res.json();

//     alert(`
// Status: ${data.deliveryStatus}
// ETA: ${new Date(data.estimatedDelivery).toDateString()}
//     `);
//   };

//   // ✅ Open Feedback popup
//   const openFeedbackModal = (orderId) => {
//     setCurrentOrderId(orderId);
//     setShowFeedback(true);
//   };

//   // ✅ Submit Feedback
//   const submitFeedback = async () => {
//     const rating = document.getElementById("rating").value;
//     const comment = document.getElementById("comment").value;

//     const res = await fetch(
//       `http://localhost:3001/api/v1/postpurchase/feedback`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           orderId: currentOrderId,
//           rating,
//           comment
//         })
//       }
//     );

//     const data = await res.json();
//     alert(data.message);
//     setShowFeedback(false);
//   };

//   const setOrders = () => {
//     const data = {
//       columns: [
//         { label: "Order ID", field: 'id', sort: "asc" },
//         { label: "Number of Items", field: 'numOfItems', sort: "asc" },
//         { label: "Amount", field: 'amount', sort: "asc" },
//         { label: "Status", field: 'status', sort: "asc" },
//         { label: "Actions", field: 'actions', sort: "asc" }
//       ],
//       rows: []
//     };

//     userOrders.forEach(userOrder => {
//       data.rows.push({
//         id: userOrder._id,
//         numOfItems: userOrder.orderItems.length,
//         amount: `$${userOrder.totalPrice}`,
//         status: userOrder.orderStatus && userOrder.orderStatus.includes('Delivered') ?
//           (<p style={{ color: 'green' }}>{userOrder.orderStatus}</p>) :
//           (<p style={{ color: 'red' }}>{userOrder.orderStatus}</p>),

//         // ✅ Actions Column
//         actions: (
//           <>
//             {/* View */}
//             <Link to={`/order/${userOrder._id}`} className="btn btn-primary me-2">
//               <i className='fa fa-eye'></i>
//             </Link>

//             {/* Track Now - show only if delivery started */}
//             {userOrder.deliveryStatus && (
//               <button
//                 className="btn btn-success me-2"
//                 onClick={() => trackOrder(userOrder._id)}
//               >
//                 🚚 Track Now
//               </button>
//             )}

//             {/* Feedback - only when delivered */}
//             {userOrder.deliveryStatus === "Delivered" && (
//               <button
//                 className="btn btn-warning"
//                 onClick={() => openFeedbackModal(userOrder._id)}
//               >
//                 💬 Feedback
//               </button>
//             )}
//           </>
//         )
//       });
//     });

//     return data;
//   };

//   return (
//     <Fragment>
//       <MetaData title="My Orders" />
//       <h1 className='mt-5'>My Orders</h1>

//       <MDBDataTable
//         className='px-3'
//         bordered
//         striped
//         hover
//         data={setOrders()}
//       />

//       {/* ✅ Feedback Modal */}
//       {showFeedback && (
//         <div className="modal d-block bg-dark bg-opacity-50">
//           <div className="modal-dialog">
//             <div className="modal-content">

//               <div className="modal-header">
//                 <h5>Give Feedback</h5>
//                 <button onClick={() => setShowFeedback(false)}>X</button>
//               </div>

//               <div className="modal-body">
//                 <select id="rating" className="form-control mb-2">
//                   <option value="5">⭐⭐⭐⭐⭐ - Excellent</option>
//                   <option value="4">⭐⭐⭐⭐ - Good</option>
//                   <option value="3">⭐⭐⭐ - Average</option>
//                   <option value="2">⭐⭐ - Poor</option>
//                   <option value="1">⭐ - Bad</option>
//                 </select>

//                 <textarea
//                   id="comment"
//                   className="form-control"
//                   placeholder="Write your feedback..."
//                 ></textarea>
//               </div>

//               <div className="modal-footer">
//                 <button className="btn btn-success" onClick={submitFeedback}>
//                   Submit
//                 </button>
//               </div>

//             </div>
//           </div>
//         </div>
//       )}
//     </Fragment>
//   );
// }
// import { Fragment, useEffect, useState } from "react";
// import MetaData from "../layouts/MetaData";
// import { MDBDataTable } from "mdbreact";
// import { useDispatch, useSelector } from "react-redux";
// import axios from "axios";   // ✅ FIXED
// import { userOrders as userOrdersAction } from "../../actions/orderActions";
// import { Link } from "react-router-dom";

// export default function UserOrders() {
//   const { userOrders = [] } = useSelector((state) => state.orderState);
//   const dispatch = useDispatch();

//   // Tracking modal
//   const [showTrackModal, setShowTrackModal] = useState(false);
//   const [trackingData, setTrackingData] = useState(null);

//   // Feedback / return / issue modal
//   const [showActionModal, setShowActionModal] = useState(false);
//   const [actionType, setActionType] = useState("");
//   const [currentOrderId, setCurrentOrderId] = useState("");
//   const [actionMessage, setActionMessage] = useState("");

//   useEffect(() => {
//     dispatch(userOrdersAction());
//   }, [dispatch]);

//   // ==========================
//   // 🚚 Track Order
//   // ==========================
//   const handleTrack = async (orderId) => {
//     try {
//       const { data } = await axios.get(`/api/v1/track/${orderId}`);

//       setTrackingData(data.tracking);
//       setShowTrackModal(true);
//     } catch (error) {
//       alert("Tracking request failed");
//     }
//   };

//   // ==========================
//   // ⚙ Open action modal
//   // ==========================
//   const openActionModal = (orderId, type) => {
//     setCurrentOrderId(orderId);
//     setActionType(type);
//     setShowActionModal(true);
//   };

//   // ==========================
//   // Submit feedback / issue / return
//   // ==========================
//   const submitAction = async () => {
//     try {
//       let url = "";
//       let body = {};

//       if (actionType === "feedback") {
//         url = `/api/v1/postpurchase/feedback/${currentOrderId}`;
//         body = {
//           rating: document.getElementById("rating").value,
//           message: actionMessage,
//         };
//       }

//       if (actionType === "return") {
//         url = `/api/v1/postpurchase/request-return/${currentOrderId}`;
//         body = { reason: actionMessage };
//       }

//       if (actionType === "issue") {
//         url = `/api/v1/postpurchase/report-issue/${currentOrderId}`;
//         body = { issue: actionMessage };
//       }

//       const res = await fetch(url, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(body),
//       });

//       const data = await res.json();
//       alert(data.message || "Submitted");

//       setShowActionModal(false);
//       setActionMessage("");
//     } catch (err) {
//       alert("Request failed");
//     }
//   };

//   // ==========================
//   // MDB Table
//   // ==========================
//   const setOrders = () => {
//     const data = {
//       columns: [
//         { label: "Order ID", field: "id", sort: "asc" },
//         { label: "Items", field: "numOfItems", sort: "asc" },
//         { label: "Amount", field: "amount", sort: "asc" },
//         { label: "Status", field: "status", sort: "asc" },
//         { label: "Actions", field: "actions", sort: "asc" },
//       ],
//       rows: [],
//     };

//     userOrders.forEach((order) => {
//       data.rows.push({
//         id: order._id,
//         numOfItems: order.orderItems.length,
//         amount: `$${order.totalPrice}`,

//         status:
//           order.orderStatus === "Delivered" ? (
//             <p style={{ color: "green", fontWeight: "bold" }}>Delivered</p>
//           ) : (
//             <p style={{ color: "red" }}>{order.orderStatus}</p>
//           ),

//         actions: (
//           <>
//             <Link to={`/order/${order._id}`} className="btn btn-primary me-2">
//               <i className="fa fa-eye"></i>
//             </Link>

//             {/* TRACK BUTTON FIXED */}
//             <button
//               className="btn btn-success me-2"
//               onClick={() => handleTrack(order._id)}
//             >
//               🚚 Track
//             </button>

//             {order.orderStatus === "Delivered" && (
//               <div className="dropdown d-inline">
//                 <button
//                   className="btn btn-secondary dropdown-toggle"
//                   data-bs-toggle="dropdown"
//                 >
//                   ⚙ Options
//                 </button>

//                 <ul className="dropdown-menu p-2">
//                   <li>
//                     <button
//                       className="dropdown-item"
//                       onClick={() => openActionModal(order._id, "feedback")}
//                     >
//                       💬 Feedback
//                     </button>
//                   </li>
//                   <li>
//                     <button
//                       className="dropdown-item"
//                       onClick={() => openActionModal(order._id, "return")}
//                     >
//                       ↩ Return Product
//                     </button>
//                   </li>
//                   <li>
//                     <button
//                       className="dropdown-item"
//                       onClick={() => openActionModal(order._id, "issue")}
//                     >
//                       ⚠ Report Issue
//                     </button>
//                   </li>
//                 </ul>
//               </div>
//             )}
//           </>
//         ),
//       });
//     });

//     return data;
//   };

//   // ==========================
//   // RENDER UI
//   // ==========================
//   return (
//     <Fragment>
//       <MetaData title="My Orders" />
//       <h1 className="mt-5">My Orders</h1>

//       <MDBDataTable striped bordered hover className="px-3" data={setOrders()} />

//       {/* Track Modal */}
//       {showTrackModal && trackingData && (
//         <div className="modal d-block bg-dark bg-opacity-50">
//           <div className="modal-dialog modal-lg">
//             <div className="modal-content p-3">
//               <h4>Order Tracking</h4>

//               <p>
//                 <strong>Status:</strong> {trackingData.status}
//               </p>

//               {trackingData.estimatedDelivery && (
//                 <p>
//                   <strong>ETA:</strong>{" "}
//                   {new Date(trackingData.estimatedDelivery).toDateString()}
//                 </p>
//               )}

//               <ul className="list-group mt-3">
//                 <li className="list-group-item">🟢 Order Placed</li>

//                 <li
//                   className="list-group-item"
//                   style={{
//                     opacity: trackingData.status !== "Pending" ? 1 : 0.3,
//                   }}
//                 >
//                   🟢 Processing
//                 </li>

//                 <li
//                   className="list-group-item"
//                   style={{
//                     opacity:
//                       ["Shipped", "Delivered"].includes(trackingData.status)
//                         ? 1
//                         : 0.3,
//                   }}
//                 >
//                   🚚 Shipped
//                 </li>

//                 <li
//                   className="list-group-item"
//                   style={{
//                     opacity: trackingData.status === "Delivered" ? 1 : 0.3,
//                   }}
//                 >
//                   📦 Delivered
//                 </li>
//               </ul>

//               <button
//                 className="btn btn-danger mt-3"
//                 onClick={() => setShowTrackModal(false)}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Action Modal */}
//       {showActionModal && (
//         <div className="modal d-block bg-dark bg-opacity-50">
//           <div className="modal-dialog">
//             <div className="modal-content p-3">
//               <h4 className="mb-3 text-capitalize">
//                 {actionType === "feedback" && "💬 Give Feedback"}
//                 {actionType === "return" && "↩ Request Return"}
//                 {actionType === "issue" && "⚠ Report Issue"}
//               </h4>

//               {actionType === "feedback" && (
//                 <select id="rating" className="form-control mb-2">
//                   <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
//                   <option value="4">⭐⭐⭐⭐ Good</option>
//                   <option value="3">⭐⭐⭐ Average</option>
//                   <option value="2">⭐⭐ Poor</option>
//                   <option value="1">⭐ Bad</option>
//                 </select>
//               )}

//               <textarea
//                 className="form-control"
//                 rows="3"
//                 placeholder={
//                   actionType === "feedback"
//                     ? "Write your feedback..."
//                     : actionType === "return"
//                     ? "Why do you want to return?"
//                     : "Describe the issue..."
//                 }
//                 value={actionMessage}
//                 onChange={(e) => setActionMessage(e.target.value)}
//               />

//               <div className="mt-3 d-flex justify-content-between">
//                 <button className="btn btn-success" onClick={submitAction}>
//                   Submit
//                 </button>

//                 <button
//                   className="btn btn-danger"
//                   onClick={() => setShowActionModal(false)}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </Fragment>
//   );
// }




// import { Fragment, useEffect, useState } from "react";
// import MetaData from "../layouts/MetaData";
// import { MDBDataTable } from "mdbreact";
// import { useDispatch, useSelector } from "react-redux";
// import axios from "axios";
// import { userOrders as userOrdersAction } from "../../actions/orderActions";
// import { Link } from "react-router-dom";

// export default function UserOrders() {
//   const { userOrders = [] } = useSelector((state) => state.orderState);
//   const dispatch = useDispatch();

//   // Logged-in user (added from Code 2)
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     async function loadUser() {
//       try {
//         // NOTE: Code 2 used http://localhost:8000. Keep or change to relative depending on your proxy setup.
//         const res = await axios.get("http://localhost:8000/api/v1/me", {
//           withCredentials: true,
//         });

//         setUser(res.data.user);
//         console.log("LOGGED-IN USER:", res.data.user);
//       } catch (err) {
//         console.error("FAILED TO LOAD USER", err);
//       }
//     }
//     loadUser();
//   }, []);

//   // Tracking modal
//   const [showTrackModal, setShowTrackModal] = useState(false);
//   const [trackingData, setTrackingData] = useState(null);

//   // Feedback / return / issue modal
//   const [showActionModal, setShowActionModal] = useState(false);
//   const [actionType, setActionType] = useState("");
//   const [currentOrderId, setCurrentOrderId] = useState("");
//   const [actionMessage, setActionMessage] = useState("");

//   useEffect(() => {
//     dispatch(userOrdersAction());
//   }, [dispatch]);

//   // ==========================
//   // 🚚 Track Order
//   // ==========================
//   const handleTrack = async (orderId) => {
//     try {
//       const { data } = await axios.get(`/api/v1/track/${orderId}`);

//       setTrackingData(data.tracking);
//       setShowTrackModal(true);
//     } catch (error) {
//       alert("Tracking request failed");
//     }
//   };

//   // ==========================
//   // ⚙ Open action modal
//   // ==========================
//   const openActionModal = (orderId, type) => {
//     setCurrentOrderId(orderId);
//     setActionType(type);
//     setShowActionModal(true);
//   };

//   // ==========================
//   // Submit feedback / issue / return
//   // ==========================
//   const submitAction = async () => {
//     try {
//       let url = "";
//       let body = {};

//       if (actionType === "feedback") {
//         url = `http://localhost:8000/api/v1/postpurchase/feedback/${currentOrderId}`;
//         body = {
//           rating: document.getElementById("rating").value,
//           message: actionMessage,
//         };
//       }

//       if (actionType === "return") {
//         url = `http://localhost:8000/api/v1/postpurchase/request-return/${currentOrderId}`;
//         body = { reason: actionMessage };
//       }

//       if (actionType === "issue") {
//         url = `http://localhost:8000/api/v1/postpurchase/report-issue/${currentOrderId}`;
//         body = { issue: actionMessage };
//       }

//       const res = await fetch(url, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(body),
//       });

//       const data = await res.json();
//       alert(data.message || "Submitted");

//       setShowActionModal(false);
//       setActionMessage("");
//     } catch (err) {
//       alert("Request failed");
//     }
//   };

//   // ==========================
//   // MDB Table
//   // ==========================
//   const setOrders = () => {
//     const data = {
//       columns: [
//         { label: "Order ID", field: "id", sort: "asc" },
//         { label: "Items", field: "numOfItems", sort: "asc" },
//         { label: "Amount", field: "amount", sort: "asc" },
//         { label: "Status", field: "status", sort: "asc" },
//         { label: "Actions", field: "actions", sort: "asc" },
//       ],
//       rows: [],
//     };

//     userOrders.forEach((order) => {
//       data.rows.push({
//         id: order._id,
//         numOfItems: order.orderItems.length,
//         amount: `$${order.totalPrice}`,

//         status:
//           order.orderStatus === "Delivered" ? (
//             <p style={{ color: "green", fontWeight: "bold" }}>Delivered</p>
//           ) : (
//             <p style={{ color: "red" }}>{order.orderStatus}</p>
//           ),

//         actions: (
//           <div className="d-flex gap-2">
//             {/* View Order */}
//             <Link to={`/order/${order._id}`} className="btn btn-primary btn-sm">
//               <i className="fa fa-eye"></i>
//             </Link>

//             {/* Track */}
//             <button
//               className="btn btn-success btn-sm"
//               onClick={() => handleTrack(order._id)}
//             >
//               🚚 Track
//             </button>

//             {/* Telegram Connect (uses loaded user) */}
//             {user && (
//               <a
//                 href={`https://t.me/shop_assistant_123_bot?start=${user?._id}`}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="btn btn-info btn-sm"
//               >
//                 💬 Connect Telegram
//               </a>
//             )}

//             {/* Delivered Options */}
//             {order.orderStatus === "Delivered" && (
//               <div className="dropdown d-inline">
//                 <button
//                   className="btn btn-secondary btn-sm dropdown-toggle"
//                   data-bs-toggle="dropdown"
//                 >
//                   ⚙ Options
//                 </button>

//                 <ul className="dropdown-menu p-2">
//                   <li>
//                     <button
//                       className="dropdown-item"
//                       onClick={() => openActionModal(order._id, "feedback")}
//                     >
//                       💬 Feedback
//                     </button>
//                   </li>
//                   <li>
//                     <button
//                       className="dropdown-item"
//                       onClick={() => openActionModal(order._id, "return")}
//                     >
//                       ↩ Return Product
//                     </button>
//                   </li>
//                   <li>
//                     <button
//                       className="dropdown-item"
//                       onClick={() => openActionModal(order._id, "issue")}
//                     >
//                       ⚠ Report Issue
//                     </button>
//                   </li>
//                 </ul>
//               </div>
//             )}
//           </div>
//         ),
//       });
//     });

//     return data;
//   };

//   // ==========================
//   // RENDER UI
//   // ==========================
//   return (
//     <Fragment>
//       <MetaData title="My Orders" />
//       <h1 className="mt-5">My Orders</h1>

//       <MDBDataTable striped bordered hover className="px-3" data={setOrders()} />

//       {/* Track Modal (uses Code 2's simpler static list) */}
//       {showTrackModal && trackingData && (
//         <div className="modal d-block bg-dark bg-opacity-50">
//           <div className="modal-dialog modal-lg">
//             <div className="modal-content p-3">
//               <h4>Order Tracking</h4>

//               <p>
//                 <strong>Status:</strong> {trackingData.status}
//               </p>

//               {trackingData.estimatedDelivery && (
//                 <p>
//                   <strong>ETA:</strong>{" "}
//                   {new Date(trackingData.estimatedDelivery).toDateString()}
//                 </p>
//               )}

//               <ul className="list-group mt-3">
//                 <li className="list-group-item">🟢 Order Placed</li>
//                 <li className="list-group-item">🟢 Processing</li>
//                 <li className="list-group-item">🚚 Shipped</li>
//                 <li className="list-group-item">📦 Delivered</li>
//               </ul>

//               <button
//                 className="btn btn-danger mt-3"
//                 onClick={() => setShowTrackModal(false)}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Action Modal */}
//       {showActionModal && (
//         <div className="modal d-block bg-dark bg-opacity-50">
//           <div className="modal-dialog">
//             <div className="modal-content p-3">
//               <h4 className="mb-3 text-capitalize">
//                 {actionType === "feedback" && "💬 Give Feedback"}
//                 {actionType === "return" && "↩ Request Return"}
//                 {actionType === "issue" && "⚠ Report Issue"}
//               </h4>

//               {actionType === "feedback" && (
//                 <select id="rating" className="form-control mb-2">
//                   <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
//                   <option value="4">⭐⭐⭐⭐ Good</option>
//                   <option value="3">⭐⭐⭐ Average</option>
//                   <option value="2">⭐⭐ Poor</option>
//                   <option value="1">⭐ Bad</option>
//                 </select>
//               )}

//               <textarea
//                 className="form-control"
//                 rows="3"
//                 placeholder={
//                   actionType === "feedback"
//                     ? "Write your feedback..."
//                     : actionType === "return"
//                     ? "Why do you want to return?"
//                     : "Describe the issue..."
//                 }
//                 value={actionMessage}
//                 onChange={(e) => setActionMessage(e.target.value)}
//               />

//               <div className="mt-3 d-flex justify-content-between">
//                 <button className="btn btn-success" onClick={submitAction}>
//                   Submit
//                 </button>

//                 <button
//                   className="btn btn-danger"
//                   onClick={() => setShowActionModal(false)}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </Fragment>
//   );
// }


import { Fragment, useEffect, useState } from "react";
import MetaData from "../layouts/MetaData";
import { MDBDataTable } from "mdbreact";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { userOrders as userOrdersAction } from "../../actions/orderActions";
import { Link } from "react-router-dom";

export default function UserOrders() {
  const dispatch = useDispatch();
  const { userOrders = [] } = useSelector((state) => state.orderState);

  // Logged in user (for telegram link)
  const [user, setUser] = useState(null);

  // Action modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // =========================
  // Load logged in user
  // =========================
  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await axios.get("/api/v1/me", {
          withCredentials: true,
        });
        setUser(data.user);
      } catch (err) {
        console.error("Failed to load user");
      }
    }
    loadUser();
  }, []);

  // =========================
  // Load orders
  // =========================
  useEffect(() => {
    dispatch(userOrdersAction());
  }, [dispatch]);

  // =========================
  // Open action modal
  // =========================
  const openActionModal = (orderId, type) => {
    setCurrentOrderId(orderId);
    setActionType(type);
    setShowActionModal(true);
  };

  // =========================
  // Submit feedback / return / issue
  // =========================
  const submitAction = async () => {
    try {
      let url = "";
      let body = {};

      if (actionType === "feedback") {
        url = `/api/v1/postpurchase/feedback/${currentOrderId}`;
        body = {
          rating: document.getElementById("rating").value,
          comment: actionMessage,
        };
      }

      if (actionType === "return") {
        url = `/api/v1/postpurchase/return/${currentOrderId}`;
        body = { reason: actionMessage };
      }

      if (actionType === "issue") {
        url = `/api/v1/postpurchase/report-issue/${currentOrderId}`;
        body = {
          issueType: "General",
          issueDescription: actionMessage,
        };
      }

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      alert(data.message || "Submitted");

      setShowActionModal(false);
      setActionMessage("");
    } catch (err) {
      alert("Request failed");
    }
  };

  // =========================
  // MDB Table data
  // =========================
  const setOrders = () => {
    const data = {
      columns: [
        { label: "Order ID", field: "id" },
        { label: "Items", field: "items" },
        { label: "Amount", field: "amount" },
        { label: "Delivery Status", field: "status" },
        { label: "Actions", field: "actions" },
      ],
      rows: [],
    };

    userOrders.forEach((order) => {
      data.rows.push({
        id: order._id,
        items: order.orderItems.length,
        amount: `₹${order.totalPrice}`,

        status:
          order.deliveryStatus === "Delivered" ? (
            <span style={{ color: "green", fontWeight: "bold" }}>
              Delivered
            </span>
          ) : (
            <span style={{ color: "orange" }}>
              {order.deliveryStatus}
            </span>
          ),

        actions: (
          <div className="d-flex gap-2 flex-wrap">
            {/* View Order */}
            <Link
              to={`/order/${order._id}`}
              className="btn btn-primary btn-sm"
            >
              👁 View
            </Link>

            {/* Track Order (NEW PAGE) */}
            <Link
              to={`/track/${order._id}`}
              className="btn btn-success btn-sm"
            >
              🚚 Track
            </Link>

            {/* Telegram Connect */}
            {user && (
              <a
                href={`https://t.me/shop_assistant_123_bot?start=${user._id}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-info btn-sm"
              >
                💬 Telegram
              </a>
            )}

            {/* Delivered options */}
            {order.deliveryStatus === "DELIVERED" && (
              <div className="dropdown">
                <button
                  className="btn btn-secondary btn-sm dropdown-toggle"
                  data-bs-toggle="dropdown"
                >
                  ⚙ Options
                </button>

                <ul className="dropdown-menu p-2">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() =>
                        openActionModal(order._id, "feedback")
                      }
                    >
                      ⭐ Feedback
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() =>
                        openActionModal(order._id, "return")
                      }
                    >
                      ↩ Return
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() =>
                        openActionModal(order._id, "issue")
                      }
                    >
                      ⚠ Issue
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ),
      });
    });

    return data;
  };

  // =========================
  // UI
  // =========================
  return (
    <Fragment>
      <MetaData title="My Orders" />
      <h1 className="mt-5">My Orders</h1>

      <MDBDataTable
        striped
        bordered
        hover
        className="px-3"
        data={setOrders()}
      />

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal d-block bg-dark bg-opacity-50">
          <div className="modal-dialog">
            <div className="modal-content p-3">
              <h4 className="mb-3 text-capitalize">
                {actionType === "feedback" && "Give Feedback"}
                {actionType === "return" && "Request Return"}
                {actionType === "issue" && "Report Issue"}
              </h4>

              {actionType === "feedback" && (
                <select id="rating" className="form-control mb-2">
                  <option value="5">⭐⭐⭐⭐⭐</option>
                  <option value="4">⭐⭐⭐⭐</option>
                  <option value="3">⭐⭐⭐</option>
                  <option value="2">⭐⭐</option>
                  <option value="1">⭐</option>
                </select>
              )}

              <textarea
                className="form-control"
                rows="3"
                placeholder="Enter message..."
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
              />

              <div className="mt-3 d-flex justify-content-between">
                <button
                  className="btn btn-success"
                  onClick={submitAction}
                >
                  Submit
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
}
