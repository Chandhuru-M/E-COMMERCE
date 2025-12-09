//import { Fragment, useEffect} from 'react'
//import MetaData from '../layouts/MetaData';
//import {MDBDataTable} from 'mdbreact'
//import { useDispatch, useSelector } from 'react-redux';
// import { userOrders as userOrdersAction } from '../../actions/orderActions';
// import { Link } from 'react-router-dom';

// export default function UserOrders () {
//     const { userOrders = []} = useSelector(state => state.orderState)
//     const dispatch = useDispatch();

//     useEffect(() => {
//         dispatch(userOrdersAction())
//     },[])

//     const setOrders = () => {
//         const data = {
//             columns: [
//                 {
//                     label: "Order ID",
//                     field: 'id',
//                     sort: "asc"
//                 },
//                 {
//                     label: "Number of Items",
//                     field: 'numOfItems',
//                     sort: "asc"
//                 },
//                 {
//                     label: "Amount",
//                     field: 'amount',
//                     sort: "asc"
//                 },
//                 {
//                     label: "Status",
//                     field: 'status',
//                     sort: "asc"
//                 },
//                 {
//                     label: "Actions",
//                     field: 'actions',
//                     sort: "asc"
//                 }
//             ],
//             rows:[]
//         }

//         userOrders.forEach(userOrder => {
//             data.rows.push({
//                 id:  userOrder._id,
//                 numOfItems: userOrder.orderItems.length,
//                 amount: `$${userOrder.totalPrice}`,
//                 status: userOrder.orderStatus && userOrder.orderStatus.includes('Delivered') ?
//                 (<p style={{color: 'green'}}> {userOrder.orderStatus} </p>):
//                 (<p style={{color: 'red'}}> {userOrder.orderStatus} </p>),
//                 actions: <Link to={`/order/${userOrder._id}`} className="btn btn-primary" >
//                     <i className='fa fa-eye'></i>
//                 </Link>
//             })
//         })


//         return  data;
//     }


//     return (
//         <Fragment>
//             <MetaData title="My Orders" />
//             <h1 className='mt-5'>My Orders</h1> 
//             <MDBDataTable
//                 className='px-3'
//                 bordered
//                 striped
//                 hover
//                 data={setOrders()}
//             />
//         </Fragment>
//     )
// }
import { Fragment, useEffect, useState } from 'react';
import MetaData from '../layouts/MetaData';
import { MDBDataTable } from 'mdbreact';
import { useDispatch, useSelector } from 'react-redux';
import { userOrders as userOrdersAction } from '../../actions/orderActions';
import { Link } from 'react-router-dom';

export default function UserOrders() {
  const { userOrders = [] } = useSelector(state => state.orderState);
  const dispatch = useDispatch();

  const [showFeedback, setShowFeedback] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");

  useEffect(() => {
    dispatch(userOrdersAction());
  }, [dispatch]);

  // ✅ Track Order
  const trackOrder = async (orderId) => {
    const res = await fetch(
      `http://localhost:3001/api/v1/fulfillment/track/${orderId}`
    );
    const data = await res.json();

    alert(`
Status: ${data.deliveryStatus}
ETA: ${new Date(data.estimatedDelivery).toDateString()}
    `);
  };

  // ✅ Open Feedback popup
  const openFeedbackModal = (orderId) => {
    setCurrentOrderId(orderId);
    setShowFeedback(true);
  };

  // ✅ Submit Feedback
  const submitFeedback = async () => {
    const rating = document.getElementById("rating").value;
    const comment = document.getElementById("comment").value;

    const res = await fetch(
      `http://localhost:3001/api/v1/postpurchase/feedback`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: currentOrderId,
          rating,
          comment
        })
      }
    );

    const data = await res.json();
    alert(data.message);
    setShowFeedback(false);
  };

  const setOrders = () => {
    const data = {
      columns: [
        { label: "Order ID", field: 'id', sort: "asc" },
        { label: "Number of Items", field: 'numOfItems', sort: "asc" },
        { label: "Amount", field: 'amount', sort: "asc" },
        { label: "Status", field: 'status', sort: "asc" },
        { label: "Actions", field: 'actions', sort: "asc" }
      ],
      rows: []
    };

    userOrders.forEach(userOrder => {
      data.rows.push({
        id: userOrder._id,
        numOfItems: userOrder.orderItems.length,
        amount: `$${userOrder.totalPrice}`,
        status: userOrder.orderStatus && userOrder.orderStatus.includes('Delivered') ?
          (<p style={{ color: 'green' }}>{userOrder.orderStatus}</p>) :
          (<p style={{ color: 'red' }}>{userOrder.orderStatus}</p>),

        // ✅ Actions Column
        actions: (
          <>
            {/* View */}
            <Link to={`/order/${userOrder._id}`} className="btn btn-primary me-2">
              <i className='fa fa-eye'></i>
            </Link>

            {/* Track Now - show only if delivery started */}
            {userOrder.deliveryStatus && (
              <button
                className="btn btn-success me-2"
                onClick={() => trackOrder(userOrder._id)}
              >
                🚚 Track Now
              </button>
            )}

            {/* Feedback - only when delivered */}
            {userOrder.deliveryStatus === "Delivered" && (
              <button
                className="btn btn-warning"
                onClick={() => openFeedbackModal(userOrder._id)}
              >
                💬 Feedback
              </button>
            )}
          </>
        )
      });
    });

    return data;
  };

  return (
    <Fragment>
      <MetaData title="My Orders" />
      <h1 className='mt-5'>My Orders</h1>

      <MDBDataTable
        className='px-3'
        bordered
        striped
        hover
        data={setOrders()}
      />

      {/* ✅ Feedback Modal */}
      {showFeedback && (
        <div className="modal d-block bg-dark bg-opacity-50">
          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header">
                <h5>Give Feedback</h5>
                <button onClick={() => setShowFeedback(false)}>X</button>
              </div>

              <div className="modal-body">
                <select id="rating" className="form-control mb-2">
                  <option value="5">⭐⭐⭐⭐⭐ - Excellent</option>
                  <option value="4">⭐⭐⭐⭐ - Good</option>
                  <option value="3">⭐⭐⭐ - Average</option>
                  <option value="2">⭐⭐ - Poor</option>
                  <option value="1">⭐ - Bad</option>
                </select>

                <textarea
                  id="comment"
                  className="form-control"
                  placeholder="Write your feedback..."
                ></textarea>
              </div>

              <div className="modal-footer">
                <button className="btn btn-success" onClick={submitFeedback}>
                  Submit
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
}
