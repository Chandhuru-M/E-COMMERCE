import Sidebar from "./Sidebar";
import {useDispatch, useSelector} from 'react-redux';
import { useEffect } from "react";
import { getAdminProducts } from "../../actions/productActions";
import {getUsers} from '../../actions/userActions'
import {adminOrders as adminOrdersAction} from '../../actions/orderActions'
import { Link } from "react-router-dom";

export default function Dashboard () {
    const { products = [] } = useSelector( state => state.productsState);
    const { adminOrders = [] } = useSelector( state => state.orderState);
    const { users = [] } = useSelector( state => state.userState);
    const dispatch = useDispatch();
    let outOfStock = 0;

    if (products.length > 0) {
        products.forEach( product => {
            if( product.stock === 0  ) {
                outOfStock = outOfStock + 1;
            }
        })
    }

    let totalAmount = 0;
    if (adminOrders.length > 0) {
        adminOrders.forEach( order => {
            totalAmount += order.totalPrice
        })
    }



    useEffect( () => {
       dispatch(getAdminProducts());
       dispatch(getUsers());
       dispatch(adminOrdersAction());
       console.log('Admin Orders:', adminOrders);
    }, [dispatch])


    return (
        <div className="row m-0">
            <div className="col-12 col-md-auto p-0">
                    <Sidebar/>
            </div>
            <div className="col-12 col-md">
                <div className="dashboard-content container-fluid px-4">
                    <h1 className="my-4 dashboard-title">Dashboard Overview</h1>
                    
                    <div className="row mb-4">
                        <div className="col-xl-3 col-md-6 mb-4">
                            <div className="card dashboard-card h-100 border-left-primary shadow py-2">
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                                Total Revenue</div>
                                            <div className="h5 mb-0 font-weight-bold text-gray-800">${totalAmount.toFixed(2)}</div>
                                        </div>
                                        <div className="col-auto">
                                            <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6 mb-4">
                            <div className="card dashboard-card h-100 border-left-success shadow py-2">
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                                Products</div>
                                            <div className="h5 mb-0 font-weight-bold text-gray-800">{products.length}</div>
                                        </div>
                                        <div className="col-auto">
                                            <i className="fas fa-box fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                    <Link to="/admin/products" className="stretched-link"></Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6 mb-4">
                            <div className="card dashboard-card h-100 border-left-info shadow py-2">
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Orders</div>
                                            <div className="h5 mb-0 font-weight-bold text-gray-800">{adminOrders.length}</div>
                                        </div>
                                        <div className="col-auto">
                                            <i className="fas fa-shopping-cart fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                    <Link to="/admin/orders" className="stretched-link"></Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6 mb-4">
                            <div className="card dashboard-card h-100 border-left-warning shadow py-2">
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Users</div>
                                            <div className="h5 mb-0 font-weight-bold text-gray-800">{users.length}</div>
                                        </div>
                                        <div className="col-auto">
                                            <i className="fas fa-users fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                    <Link to="/admin/users" className="stretched-link"></Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-xl-3 col-md-6 mb-4">
                            <div className="card dashboard-card h-100 border-left-danger shadow py-2">
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">Out of Stock</div>
                                            <div className="h5 mb-0 font-weight-bold text-gray-800">{outOfStock}</div>
                                        </div>
                                        <div className="col-auto">
                                            <i className="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6 mb-4">
                            <div className="card dashboard-card h-100 border-left-dark shadow py-2">
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className="text-xs font-weight-bold text-dark text-uppercase mb-1">POS System</div>
                                            <div className="h5 mb-0 font-weight-bold text-gray-800">Barcode Scanner</div>
                                        </div>
                                        <div className="col-auto">
                                            <i className="fas fa-barcode fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                    <Link to="/pos" className="stretched-link"></Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-3 col-md-6 mb-4">
                            <div className="card dashboard-card h-100 border-left-secondary shadow py-2">
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className="text-xs font-weight-bold text-secondary text-uppercase mb-1">Support</div>
                                            <div className="h5 mb-0 font-weight-bold text-gray-800">Help Desk</div>
                                        </div>
                                        <div className="col-auto">
                                            <i className="fas fa-headset fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                    <Link to="/admin/support" className="stretched-link"></Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-xl-8 col-lg-7">
                            <div className="card shadow mb-4">
                                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                    <h6 className="m-0 font-weight-bold text-primary">Earnings Overview</h6>
                                </div>
                                <div className="card-body">
                                    <div className="chart-area d-flex justify-content-center align-items-center" style={{height: '300px', background: '#f8f9fc'}}>
                                        <p className="text-muted">Chart Visualization Placeholder</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-4 col-lg-5">
                            <div className="card shadow mb-4">
                                <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                    <h6 className="m-0 font-weight-bold text-primary">Stock Status</h6>
                                </div>
                                <div className="card-body">
                                    <div className="mb-3">
                                        <h4 className="small font-weight-bold">In Stock <span className="float-right">{products.length - outOfStock}</span></h4>
                                        <div className="progress mb-4">
                                            <div className="progress-bar bg-success" role="progressbar" style={{width: `${((products.length - outOfStock)/products.length)*100}%`}} aria-valuenow="20" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <h4 className="small font-weight-bold">Out of Stock <span className="float-right">{outOfStock}</span></h4>
                                        <div className="progress mb-4">
                                            <div className="progress-bar bg-danger" role="progressbar" style={{width: `${(outOfStock/products.length)*100}%`}} aria-valuenow="20" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}