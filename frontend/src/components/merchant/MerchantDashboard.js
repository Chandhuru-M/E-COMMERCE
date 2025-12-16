import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MetaData from '../layouts/MetaData';
import MerchantSidebar from './MerchantSidebar';

export default function MerchantDashboard() {
  const { user } = useSelector(state => state.authState);

  return (
    <div className="row m-0">
      <MetaData title={'Merchant Dashboard'} />
      <div className="col-12 col-md-auto p-0">
          <MerchantSidebar/>
      </div>
      
      <div className="col-12 col-md">
        <div className="dashboard-content container-fluid px-4">
          <div className="mb-4 mt-4">
            <h1 className="h3 text-gray-800">Merchant Dashboard</h1>
            <h5 className="text-muted mt-2">Welcome, {user?.name}</h5>
          </div>

          <div className="row">
            {/* POS System Card */}
            <div className="col-xl-4 col-md-6 mb-4">
              <div className="card dashboard-card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                        Point of Sale</div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">Open POS</div>
                    </div>
                  </div>
                  <Link to="/pos" className="stretched-link"></Link>
                </div>
              </div>
            </div>

            {/* Inventory Management Card */}
            <div className="col-xl-4 col-md-6 mb-4">
              <div className="card dashboard-card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                        Inventory</div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">Manage Stock</div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-boxes fa-2x text-gray-300"></i>
                    </div>
                  </div>
                  <Link to="/merchant/inventory" className="stretched-link"></Link>
                </div>
              </div>
            </div>

            {/* Orders Card */}
            <div className="col-xl-4 col-md-6 mb-4">
              <div className="card dashboard-card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                        Orders</div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">View Orders</div>
                    </div>
                  </div>
                  <Link to="/merchant/orders" className="stretched-link"></Link>
                </div>
              </div>
            </div>

            {/* Analytics Card */}
            <div className="col-xl-4 col-md-6 mb-4">
              <div className="card dashboard-card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                        Analytics</div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">Business Insights</div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-chart-line fa-2x text-gray-300"></i>
                    </div>
                  </div>
                  <Link to="/merchant/analytics" className="stretched-link"></Link>
                </div>
              </div>
            </div>

            {/* Support Center Card */}
            <div className="col-xl-4 col-md-6 mb-4">
              <div className="card dashboard-card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                        Support Center</div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">Get Help</div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-headset fa-2x text-gray-300"></i>
                    </div>
                  </div>
                  <Link to="/merchant/support" className="stretched-link"></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
