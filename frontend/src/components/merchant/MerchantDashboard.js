import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MetaData from '../layouts/MetaData';

export default function MerchantDashboard() {
  const { user } = useSelector(state => state.authState);

  return (
    <div className="container container-fluid">
      <MetaData title={'Merchant Dashboard'} />
      <div className="row">
        <div className="col-12">
          <h1 className="my-4">Welcome, {user?.name}!</h1>
          <p className="lead">Manage your store operations</p>

          <div className="row mt-5">
            {/* POS System Card */}
            <div className="col-md-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-5">
                  <i className="fa fa-barcode fa-4x text-success mb-3"></i>
                  <h3 className="card-title">POS System</h3>
                  <p className="card-text text-muted">
                    Scan barcodes, manage cart, and process walk-in customer sales
                  </p>
                  <Link to="/pos" className="btn btn-success btn-lg mt-3">
                    <i className="fa fa-barcode mr-2"></i> Open POS
                  </Link>
                </div>
              </div>
            </div>

            {/* Inventory Management Card */}
            <div className="col-md-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-5">
                  <i className="fa fa-boxes fa-4x text-primary mb-3"></i>
                  <h3 className="card-title">Inventory</h3>
                  <p className="card-text text-muted">
                    View and manage your product inventory and stock levels
                  </p>
                  <Link to="/merchant/inventory" className="btn btn-primary btn-lg mt-3">
                    <i className="fa fa-boxes mr-2"></i> Manage Inventory
                  </Link>
                </div>
              </div>
            </div>

            {/* Orders Card */}
            <div className="col-md-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-5">
                  <i className="fa fa-shopping-cart fa-4x text-info mb-3"></i>
                  <h3 className="card-title">Orders</h3>
                  <p className="card-text text-muted">
                    View all orders processed through your POS system
                  </p>
                  <Link to="/merchant/orders" className="btn btn-info btn-lg mt-3">
                    <i className="fa fa-shopping-cart mr-2"></i> View Orders
                  </Link>
                </div>
              </div>
            </div>

            {/* Analytics Card */}
            <div className="col-md-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-5">
                  <i className="fa fa-chart-line fa-4x text-warning mb-3"></i>
                  <h3 className="card-title">Analytics</h3>
                  <p className="card-text text-muted">
                    View sales reports and business insights
                  </p>
                  <Link to="/merchant/analytics" className="btn btn-warning btn-lg mt-3">
                    <i className="fa fa-chart-line mr-2"></i> View Analytics
                  </Link>
                </div>
              </div>
            </div>

            {/* Support Center Card */}
            <div className="col-md-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-5">
                  <i className="fa fa-headset fa-4x text-danger mb-3"></i>
                  <h3 className="card-title">Support Center</h3>
                  <p className="card-text text-muted">
                    Get help with payments, shipping, and store management
                  </p>
                  <Link to="/merchant/support" className="btn btn-danger btn-lg mt-3">
                    <i className="fa fa-headset mr-2"></i> Get Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
