import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Loader from '../layouts/Loader';
import MetaData from '../layouts/MetaData';
import MerchantSidebar from './MerchantSidebar';

export default function MerchantAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useSelector(state => state.authState);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const merchantId = localStorage.getItem('merchantId') || user?._id;
      const { data } = await axios.get(`/api/v1/orders?merchantId=${merchantId}`);
      const orders = data.orders || [];

      const today = new Date().toDateString();
      const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);

      setAnalytics({
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        recentOrders: orders.slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="row m-0">
      <MetaData title={'Sales Analytics'} />
      <div className="col-12 col-md-auto p-0">
          <MerchantSidebar/>
      </div>
      
      <div className="col-12 col-md">
        <div className="container container-fluid">
          <h1 className="my-4">Sales Analytics</h1>

      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h5>Total Orders</h5>
              <h2>{analytics.totalOrders}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h5>Total Revenue</h5>
              <h2>${analytics.totalRevenue.toFixed(2)}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h5>Today's Orders</h5>
              <h2>{analytics.todayOrders}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-white">
            <div className="card-body text-center">
              <h5>Today's Revenue</h5>
              <h2>${analytics.todayRevenue.toFixed(2)}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h4>Recent Orders</h4>
        </div>
        <div className="card-body">
          {analytics.recentOrders.length === 0 ? (
            <p className="text-center text-muted">No orders yet</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentOrders.map(order => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-8)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.orderItems?.length || 0}</td>
                    <td>${order.totalPrice?.toFixed(2)}</td>
                    <td>
                      {order.paymentInfo?.status === 'PAID' || order.paymentInfo?.status === 'succeeded' ? (
                        <span className="badge badge-success">
                          <i className="fa fa-check-circle"></i> PAID
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <i className="fa fa-times-circle"></i> NOT PAID
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
