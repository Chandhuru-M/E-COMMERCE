import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Search from './Search';
import {useDispatch, useSelector} from 'react-redux';
import {DropdownButton, Dropdown, Image} from 'react-bootstrap';
import { logout } from '../../actions/userActions';
import ThemeToggle from '../ThemeToggle';


export default function Header () {
    const { isAuthenticated, user } = useSelector(state => state.authState);
    const { items:cartItems } = useSelector(state => state.cartState)
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const logoutHandler = () => {
      dispatch(logout());
    }


    return (
    <nav className="navbar row">
        <div className="col-12 col-md-2">
          <div className="navbar-brand">
            <Link to="/">
              <img width="150px" alt='AURA Logo' src="/images/Aura.png" />
            </Link>
            </div>
        </div>
  
        <div className="col-12 col-md-5 mt-2 mt-md-0">
           <Search/>
        </div>
  
        <div className="col-12 col-md-5 mt-2 mt-md-0 d-flex align-items-center justify-content-end" style={{gap: '1rem'}}>
          <ThemeToggle/>
          { isAuthenticated ? 
            (
              <Dropdown className='d-inline' >
                  <Dropdown.Toggle variant='default text-dark pr-5' id='dropdown-basic' style={{background: 'transparent', border: 'none', color: 'inherit'}}>
                    <figure className='avatar avatar-nav'>
                      <Image width="50px" src={user.avatar??'./images/default_avatar.png'}  />
                    </figure>
                    <span>{user.name}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                      { user.role === 'admin' && <Dropdown.Item onClick={() => {navigate('admin/dashboard')}} className='text-dark'><i className="fa fa-tachometer-alt"></i> Dashboard</Dropdown.Item> }
                      { user.role === 'merchant_admin' && <Dropdown.Item onClick={() => {navigate('/merchant/dashboard')}} className='text-dark'><i className="fa fa-store"></i> Dashboard</Dropdown.Item> }
                      { (user.role === 'admin' || user.role === 'merchant_admin' || user.role === 'staff') && 
                        <Dropdown.Item onClick={() => {navigate('/pos')}} className='text-success'><i className="fa fa-barcode"></i> POS System</Dropdown.Item> 
                      }
                      <Dropdown.Item onClick={() => {navigate('/myprofile')}} className='text-dark'><i className="fa fa-user"></i> Profile</Dropdown.Item>
                      { user.role === 'user' && <Dropdown.Item onClick={() => {navigate('/orders')}} className='text-dark'><i className="fa fa-shopping-bag"></i> Orders</Dropdown.Item> }
                      { user.role === 'merchant_admin' && <Dropdown.Item onClick={() => {navigate('/merchant/support')}} className='text-warning'><i className="fa fa-headset"></i> Support Center</Dropdown.Item> }
                      { user.role === 'user' && <Dropdown.Item onClick={() => {navigate('/support')}} className='text-warning'><i className="fa fa-question-circle"></i> Support</Dropdown.Item> }
                      { user.role === 'user' && <Dropdown.Item as="a" href={`https://t.me/shop_assistant_123_bot?start=${user._id}`} target="_blank" rel="noreferrer" className='text-info'><i className="fab fa-telegram"></i> Connect Telegram</Dropdown.Item> }
                      <Dropdown.Item onClick={logoutHandler} className='text-danger'><i className="fa fa-sign-out-alt"></i> Logout</Dropdown.Item>
                  </Dropdown.Menu>
              </Dropdown>
            )
          
          :
            <Link to="/login"  className="btn" id="login_btn">Login</Link>
          }
          { user && user.role === 'user' && (
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Link to="/cart"><span id="cart">Cart</span></Link>
              <span id="cart_count">{cartItems.length}</span>
            </div>
          ) }
        </div>
    </nav>
    )
}