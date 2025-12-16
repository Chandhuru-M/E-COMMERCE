import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NavDropdown } from 'react-bootstrap';

export default function Sidebar () {

    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname.includes(path) ? 'active' : '';
    }

    return (
        <div className="sidebar-wrapper">
            <nav id="sidebar">
                <div className="sidebar-header">
                    <h3>Admin Panel</h3>
                </div>

                <ul className="list-unstyled components">
                    <li className={location.pathname === '/admin/dashboard' ? 'active' : ''}>
                        <Link to="/admin/dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</Link>
                    </li>
            
                    <li className={location.pathname.includes('/admin/products') ? 'active' : ''}>
                        <NavDropdown title={
                            <span><i className='fa fa-box-open'></i> Products</span>
                        }>
                            <NavDropdown.Item onClick={() => navigate('/admin/products')} > <i className='fa fa-list'></i> All Products</NavDropdown.Item>
                            <NavDropdown.Item onClick={() => navigate('/admin/products/create')} > <i className='fa fa-plus'></i> Create Product</NavDropdown.Item>
                        </NavDropdown>
                    </li>

                    <li className={location.pathname.includes('/admin/orders') ? 'active' : ''}>
                        <Link to="/admin/orders"><i className="fa fa-shopping-cart"></i> Orders</Link>
                    </li>

                    <li className={location.pathname.includes('/admin/users') ? 'active' : ''}>
                        <Link to="/admin/users"><i className="fa fa-users"></i> Users</Link>
                    </li>

                    <li className={location.pathname.includes('/admin/reviews') ? 'active' : ''}>
                        <Link to="/admin/reviews"><i className="fa fa-star"></i> Reviews</Link>
                    </li>

                    <li className={location.pathname.includes('/admin/merchant-requests') ? 'active' : ''}>
                        <Link to="/admin/merchant-requests"><i className="fa fa-store"></i> Merchant Requests</Link>
                    </li>
            
                </ul>
            </nav>
        </div>
    )
}