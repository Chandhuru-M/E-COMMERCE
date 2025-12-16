import { Fragment, useEffect } from 'react'
import {useDispatch, useSelector} from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { decreaseCartItemQty, increaseCartItemQty,removeItemFromCart, addCartItemSuccess } from '../../slices/cartSlice';
import axios from 'axios';

export default function Cart() {
    const {items } = useSelector(state => state.cartState)
    const {user} = useSelector(state => state.authState)
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Load Telegram cart whenever cart page is viewed
    useEffect(() => {
        loadTelegramCart();
    }, [user]); // Re-run when user changes

    const loadTelegramCart = async () => {
        try {
            const { data } = await axios.get('/api/v1/me', { withCredentials: true });
            const telegramCart = data.user.telegramCart || [];
            
            console.log('📱 Telegram cart items from database:', telegramCart);
            
            if (telegramCart.length > 0) {
                // Check if cart already has items - don't duplicate
                if (items.length > 0) {
                    console.log('ℹ️ Cart already has items, skipping telegram load');
                    return;
                }
                
                console.log('📥 Loading items from Telegram cart...');
                // Fetch full product details for each item
                for (const item of telegramCart) {
                    try {
                        const { data: productData } = await axios.get(`/api/v1/product/${item.product}`);
                        const product = productData.product;
                        
                        console.log(`✅ Adding ${product.name} to cart (qty: ${item.quantity})`);
                        
                        // Add to Redux cart with full product details
                        dispatch(addCartItemSuccess({
                            product: product._id,
                            name: product.name,
                            price: product.price,
                            image: product.images && product.images[0] ? product.images[0].image : '/images/default_product.png',
                            stock: product.stock,
                            quantity: item.quantity
                        }));
                    } catch (err) {
                        console.error(`❌ Error loading product ${item.product}:`, err);
                    }
                }
                
                // Clear telegram cart from backend after loading (optional - can keep for sync)
                // await axios.put('/api/v1/telegram/clear-cart', {}, { withCredentials: true });
                
                console.log('✅ Cart loaded from Telegram!');
            }
        } catch (error) {
            console.error('❌ Error loading Telegram cart:', error);
        }
    };

    // Sync cart to Telegram whenever cart changes
    useEffect(() => {
        const syncCartToTelegram = async () => {
            if (user && user._id && items.length > 0) {
                try {
                    await axios.put('/api/v1/telegram/sync-cart', 
                        { items }, 
                        { withCredentials: true }
                    );
                } catch (error) {
                    console.error('Error syncing cart to Telegram:', error);
                }
            }
        };
        
        syncCartToTelegram();
    }, [items, user]);

    const increaseQty = (item) => {
        const count = item.quantity;
        if (item.stock === 0 || count >= item.stock) return;
        dispatch(increaseCartItemQty(item.product))
    }
    const decreaseQty = (item) => {
        const count = item.quantity;
        if (count === 1) return;
        dispatch(decreaseCartItemQty(item.product))
    }

    const checkoutHandler = () =>{
        navigate('/login?redirect=shipping')
    }


    return (
        <Fragment>
            {items.length === 0 ? 
                <h2 className="mt-5">Your Cart is Empty</h2> :
                <Fragment>
                     <h2 className="mt-5">Your Cart: <b>{items.length} items</b></h2>
                    <div className="row d-flex justify-content-between">
                        <div className="col-12 col-lg-8">
                            {items.map(item => (
                                <Fragment key={item.product}>
                                    <div className="cart-item">
                                        <div className="row">
                                            <div className="col-4 col-lg-3">
                                                <img src={item.image} alt={item.name} className="cart-item-img" />
                                            </div>

                                            <div className="col-8 col-lg-9">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div className="cart-item-info">
                                                        <Link to={`/product/${item.product}`} className="cart-item-name">{item.name}</Link>
                                                        <p className={item.stock > 0 ? "cart-item-stock" : "cart-item-stock text-danger"}>
                                                            {item.stock > 0 ? "In Stock" : "Out of Stock"}
                                                        </p>
                                                        <p className="cart-item-shipping">Eligible for FREE Shipping</p>
                                                    </div>
                                                    <div className="cart-item-price-block">
                                                        <p className="cart-item-price">${item.price}</p>
                                                    </div>
                                                </div>

                                                <div className="cart-item-actions">
                                                    <div className="stockCounter">
                                                        <span className="qty-btn minus" onClick={() => decreaseQty(item)}>
                                                            <i className="fa fa-minus"></i>
                                                        </span>
                                                        <input type="number" className="form-control count" value={item.quantity} readOnly />
                                                        <span className="qty-btn plus" onClick={() => increaseQty(item)}>
                                                            <i className="fa fa-plus"></i>
                                                        </span>
                                                    </div>
                                                    <span className="action-separator">|</span>
                                                    <span className="delete-link" onClick={() => dispatch(removeItemFromCart(item.product))}>Delete</span>
                                                    <span className="action-separator">|</span>
                                                    <span className="save-link">Save for later</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <hr />
                                </Fragment>
                                )
                            )
                            }

                         
                            <hr />
                        </div>

                        <div className="col-12 col-lg-3 my-4">
                            <div id="order_summary">
                                <h4>Order Summary</h4>
                                <hr />
                                <p>Subtotal:  <span className="order-summary-values">{items.reduce((acc, item)=>(acc + item.quantity), 0)} (Units)</span></p>
                                <p>Est. total: <span className="order-summary-values">${items.reduce((acc, item)=>(acc + item.quantity * item.price), 0)}</span></p>
                
                                <hr />
                                <button id="checkout_btn" onClick={checkoutHandler} className="btn btn-primary btn-block">Check out</button>
                            </div>
                        </div>
                    </div>
                </Fragment>
            }
           
        </Fragment>
    )
}