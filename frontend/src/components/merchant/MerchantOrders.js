import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Loader from '../layouts/Loader';
import MetaData from '../layouts/MetaData';

export default function MerchantOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector(state => state.authState);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const merchantId = localStorage.getItem('merchantId') || user?._id;
      const { data } = await axios.get(`/api/v1/orders?merchantId=${merchantId}`);
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container container-fluid">
      <MetaData title={'My Orders'} />
      <h1 className="my-4">POS Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-5">
          <i className="fa fa-shopping-cart fa-3x text-muted mb-3"></i>
          <p className="lead">No orders yet</p>
          <Link to="/pos" className="btn btn-primary">
            <i className="fa fa-barcode mr-2"></i> Go to POS
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-8)}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>{order.orderItems?.length || 0} items</td>
                  <td>${order.totalPrice?.toFixed(2)}</td>
                  <td>
                    {order.paymentInfo?.status === 'PAID' || order.paymentInfo?.status === 'succeeded' ? (
                      <span className="badge badge-success">
                        <i className="fa fa-check-circle"></i> PAID
                        {order.paymentInfo?.method && ` (${order.paymentInfo.method})`}
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        <i className="fa fa-times-circle"></i> NOT PAID
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${order.orderStatus === 'Processing' ? 'warning' : 'success'}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td>
                    <Link to={`/order/${order._id}`} className="btn btn-primary btn-sm">
                      <i className="fa fa-eye"></i> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
