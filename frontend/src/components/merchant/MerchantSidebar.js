import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function MerchantSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="sidebar-wrapper">
            <nav id="sidebar">
                <div className="sidebar-header">
                    <h3>Merchant Panel</h3>
                </div>

                <ul className="list-unstyled components">
                    <li className={location.pathname === '/merchant/dashboard' ? 'active' : ''}>
                        <Link to="/merchant/dashboard"><i className="fa fa-tachometer-alt"></i> Dashboard</Link>
                    </li>

                    <li className={location.pathname === '/pos' ? 'active' : ''}>
                        <Link to="/pos"><i className="fa fa-barcode"></i> POS System</Link>
                    </li>

                    <li className={location.pathname.includes('/merchant/inventory') ? 'active' : ''}>
                        <Link to="/merchant/inventory"><i className="fa fa-boxes"></i> Inventory</Link>
                    </li>

                    <li className={location.pathname.includes('/merchant/orders') ? 'active' : ''}>
                        <Link to="/merchant/orders"><i className="fa fa-shopping-cart"></i> Orders</Link>
                    </li>

                    <li className={location.pathname.includes('/merchant/analytics') ? 'active' : ''}>
                        <Link to="/merchant/analytics"><i className="fa fa-chart-line"></i> Analytics</Link>
                    </li>

                    <li className={location.pathname.includes('/merchant/support') ? 'active' : ''}>
                        <Link to="/merchant/support"><i className="fa fa-headset"></i> Support Center</Link>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
