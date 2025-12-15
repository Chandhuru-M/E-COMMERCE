
import './App.css';
import Home from './components/Home';
import Footer from './components/layouts/Footer';
import Header from './components/layouts/Header';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductDetail from './components/product/ProductDetail';
import ProductSearch from './components/product/ProductSearch';
import Login from './components/user/Login';
import Register from './components/user/Register';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import store from './store';
import { loadUser } from './actions/userActions';
import Profile from './components/user/Profile';
import ProtectedRoute from './components/route/ProtectedRoute';
import UpdateProfile from './components/user/UpdateProfile';
import UpdatePassword from './components/user/UpdatePassword';
import ForgotPassword from './components/user/ForgotPassword';
import ResetPassword from './components/user/ResetPassword';
import Cart from './components/cart/Cart';
import Shipping from './components/cart/Shipping';
import ConfirmOrder from './components/cart/ConfirmOrder';
import Payment from './components/cart/Payment';
import axios from 'axios';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import OrderSuccess from './components/cart/OrderSuccess';
import UserOrders from './components/order/UserOrders';
import OrderDetail from './components/order/OrderDetail';
import Dashboard from './components/admin/Dashboard';
import ProductList from './components/admin/ProductList';
import NewProduct from './components/admin/NewProduct';
import UpdateProduct from './components/admin/UpdateProduct';
import OrderList from './components/admin/OrderList';
import UpdateOrder from './components/admin/UpdateOrder';
import UserList from './components/admin/UserList';
import UpdateUser from './components/admin/UpdateUser';
import ReviewList from './components/admin/ReviewList';
import TrackOrder from "./components/order/TrackOrder";


// ⭐ Chatbot toggle button component
import ChatAssistant from './components/assistant/ChatAssistant';
import POSSystem from './components/pos/POSSystem';

// Merchant components
import MerchantRequestForm from './components/merchant/MerchantRequestForm';
import MerchantDashboard from './components/merchant/MerchantDashboard';
import MerchantOrders from './components/merchant/MerchantOrders';
import MerchantInventory from './components/merchant/MerchantInventory';
import MerchantAnalytics from './components/merchant/MerchantAnalytics';
import MerchantNewProduct from './components/merchant/MerchantNewProduct';
import MerchantUpdateProduct from './components/merchant/MerchantUpdateProduct';
import MerchantRequests from './components/admin/MerchantRequests';

// Help Desk components
import HelpDesk from './pages/HelpDesk/HelpDesk';
import MerchantHelpDesk from './pages/HelpDesk/MerchantHelpDesk';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';

// Configure axios to send credentials (cookies) with every request
axios.defaults.withCredentials = true;

function App() {
  const [stripeApiKey, setStripeApiKey] = useState("")

  useEffect(() => {
    store.dispatch(loadUser())
    async function getStripeApiKey(){
      const {data} = await axios.get('/api/v1/stripeapi')
      setStripeApiKey(data.stripeApiKey)
    }
    getStripeApiKey()
  },[])

  // Sync website cart to Telegram whenever cart items change
  const cartState = store.getState().cartState;
  const authState = store.getState().authState;

  useEffect(() => {
    let timer = null;
    const sync = async () => {
      try {
        const items = cartState.items || [];
        const user = authState.user;
        if (!user || !user._id) return;
        if (!items || items.length === 0) return;
        console.log('[SYNC] App-level: syncing cart to Telegram, items:', items.length);
        const res = await axios.put('/api/v1/telegram/sync-cart', { items });
        console.log('[SYNC] server response:', res.data);
      } catch (err) {
        console.error('[SYNC] Error syncing cart to Telegram:', err?.response?.data || err.message || err);
      }
    };

    // Debounce updates to avoid too many requests during rapid cart changes
    timer = setTimeout(sync, 500);
    return () => clearTimeout(timer);
  }, [/* intentionally empty - we will subscribe below */]);

  // Subscribe to store changes to trigger sync effect when cart or auth changes
  useEffect(() => {
    let prevState = store.getState();
    const unsubscribe = store.subscribe(() => {
      const nextState = store.getState();
      const prevCartItems = prevState.cartState.items || [];
      const nextCartItems = nextState.cartState.items || [];
      const prevUserId = prevState.authState.user?._id;
      const nextUserId = nextState.authState.user?._id;

      const cartChanged = JSON.stringify(prevCartItems) !== JSON.stringify(nextCartItems);
      const userChanged = prevUserId !== nextUserId;

      if (cartChanged || userChanged) {
        (async () => {
          try {
            const items = nextCartItems;
            const user = nextState.authState.user;
            if (!user || !user._id) {
              prevState = nextState;
              return;
            }
            if (!items || items.length === 0) {
              // Do not overwrite Telegram cart with empty website cart — skip sync
              console.log('[SYNC] store.subscribe: items empty — skip syncing to Telegram to avoid overwriting');
              prevState = nextState;
              return;
            }
            console.log('[SYNC] store.subscribe: syncing cart to Telegram, items:', items.length);
            const res = await axios.put('/api/v1/telegram/sync-cart', { items });
            console.log('[SYNC] server response:', res.data);
          } catch (err) {
            console.error('[SYNC] Error syncing cart to Telegram (subscribe):', err?.response?.data || err.message || err);
          }
          prevState = nextState;
        })();
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="App">
        <HelmetProvider>
            <Header/>
                <div className='container container-fluid'>
                  <ToastContainer theme='dark' />
                  <Routes>
                      <Route path='/' element={<Home/>} />
                      <Route path='/search/:keyword' element={<ProductSearch/>} />
                      <Route path='/product/:id' element={<ProductDetail/>} />
                      <Route path='/login' element={<Login/>} />
                      <Route path='/register' element={<Register/>} />
                      <Route path='/myprofile' element={<ProtectedRoute><Profile/></ProtectedRoute> } />
                      <Route path='/myprofile/update' element={<ProtectedRoute><UpdateProfile/></ProtectedRoute> } />
                      <Route path='/myprofile/update/password' element={<ProtectedRoute><UpdatePassword/></ProtectedRoute> } />
                      <Route path='/password/forgot' element={<ForgotPassword/> } />
                      <Route path='/password/reset/:token' element={<ResetPassword/> } />
                      <Route path='/cart' element={<Cart/> } />
                      <Route path='/shipping' element={<ProtectedRoute><Shipping/></ProtectedRoute> } />
                      <Route path='/order/confirm' element={<ProtectedRoute><ConfirmOrder/></ProtectedRoute> } />
                      <Route path='/order/success' element={<ProtectedRoute><OrderSuccess/></ProtectedRoute> } />
                      <Route path='/orders' element={<ProtectedRoute><UserOrders/></ProtectedRoute> } />
                      <Route path="/track/:id" element={<TrackOrder />} />
                      <Route path='/order/:id' element={<ProtectedRoute><OrderDetail/></ProtectedRoute> } />
                      {stripeApiKey && 
                        <Route path='/payment' 
                          element={
                            <ProtectedRoute>
                              <Elements stripe={loadStripe(stripeApiKey)}>
                                <Payment/>
                              </Elements>
                            </ProtectedRoute>
                          } 
                        />
                      }
                      
                      {/* Admin Routes */}
                      <Route path='/admin/dashboard' element={ <ProtectedRoute isAdmin={true}><Dashboard/></ProtectedRoute> } />
                      <Route path='/admin/products' element={ <ProtectedRoute isAdmin={true}><ProductList/></ProtectedRoute> } />
                      <Route path='/admin/products/create' element={ <ProtectedRoute isAdmin={true}><NewProduct/></ProtectedRoute> } />
                      <Route path='/admin/product/:id' element={ <ProtectedRoute isAdmin={true}><UpdateProduct/></ProtectedRoute> } />
                      <Route path='/admin/orders' element={ <ProtectedRoute isAdmin={true}><OrderList/></ProtectedRoute> } />
                      <Route path='/admin/order/:id' element={ <ProtectedRoute isAdmin={true}><UpdateOrder/></ProtectedRoute> } />
                      <Route path='/admin/users' element={ <ProtectedRoute isAdmin={true}><UserList/></ProtectedRoute> } />
                      <Route path='/admin/user/:id' element={ <ProtectedRoute isAdmin={true}><UpdateUser/></ProtectedRoute> } />
                      <Route path='/admin/reviews' element={ <ProtectedRoute isAdmin={true}><ReviewList/></ProtectedRoute> } />
                      <Route path='/admin/merchant-requests' element={ <ProtectedRoute isAdmin={true}><MerchantRequests/></ProtectedRoute> } />
                      
                      {/* Merchant Routes */}
                      <Route path='/merchant/request' element={<MerchantRequestForm/>} />
                      <Route path='/merchant/dashboard' element={<ProtectedRoute><MerchantDashboard/></ProtectedRoute>} />
                      <Route path='/merchant/orders' element={<ProtectedRoute><MerchantOrders/></ProtectedRoute>} />
                      <Route path='/merchant/inventory' element={<ProtectedRoute><MerchantInventory/></ProtectedRoute>} />
                      <Route path='/merchant/product/new' element={<ProtectedRoute><MerchantNewProduct/></ProtectedRoute>} />
                      <Route path='/merchant/product/:id' element={<ProtectedRoute><MerchantUpdateProduct/></ProtectedRoute>} />
                      <Route path='/merchant/analytics' element={<ProtectedRoute><MerchantAnalytics/></ProtectedRoute>} />
                      
                      {/* POS Route - for merchants and staff */}
                      <Route path='/pos' element={<ProtectedRoute><POSSystem/></ProtectedRoute>} />
                      
                      {/* Help Desk Routes */}
                      <Route path='/support' element={<ProtectedRoute><HelpDesk/></ProtectedRoute>} />
                      <Route path='/merchant/support' element={<ProtectedRoute><MerchantHelpDesk/></ProtectedRoute>} />
                      <Route path='/admin/support' element={<ProtectedRoute isAdmin={true}><AdminDashboard/></ProtectedRoute>} />
                  </Routes>
                </div>

            {/* ⭐ Add Chatbot Toggle Button Here */}
            <ChatAssistant />

            <Footer/>
        </HelmetProvider>
      </div>
    </Router>
  );
}

export default App;
