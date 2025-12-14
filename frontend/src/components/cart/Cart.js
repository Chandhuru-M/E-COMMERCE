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

    // Load Telegram cart if coming from Telegram
    useEffect(() => {
        const source = searchParams.get('source');
        const userId = searchParams.get('userId');
        
        if (source === 'telegram' && userId && user && user._id === userId) {
            loadTelegramCart();
        }
    }, [searchParams, user]);

    const loadTelegramCart = async () => {
        try {
            const { data } = await axios.get('/api/v1/me', { withCredentials: true });
            const telegramCart = data.user.telegramCart || [];
            
            console.log('Telegram cart items:', telegramCart);
            
            if (telegramCart.length > 0) {
                // Fetch full product details for each item
                for (const item of telegramCart) {
                    try {
                        const { data: productData } = await axios.get(`/api/v1/product/${item.product}`);
                        const product = productData.product;
                        
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
                        console.error(`Error loading product ${item.product}:`, err);
                    }
                }
                
                // Clear telegram cart from backend after loading
                await axios.put('/api/v1/telegram/clear-cart', {}, { withCredentials: true });
                
                alert('Cart loaded from Telegram! ✅');
            }
        } catch (error) {
            console.error('Error loading Telegram cart:', error);
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
                                    <hr />
                                    <div className="cart-item">
                                        <div className="row">
                                            <div className="col-4 col-lg-3">
                                                <img src={item.image} alt={item.name} height="90" width="115"/>
                                            </div>

                                            <div className="col-5 col-lg-3">
                                                <Link to={`/product/${item.product}`}>{item.name}</Link>
                                            </div>


                                            <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                                                <p id="card_item_price">${item.price}</p>
                                            </div>

                                            <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                                                <div className="stockCounter d-inline">
                                                    <span className="btn btn-danger minus" onClick={() => decreaseQty(item)}>-</span>
                                                                    <input type="number" className="form-control count d-inline" value={item.quantity} readOnly />

                                                    <span className="btn btn-primary plus" onClick={() => increaseQty(item)}>+</span>
                                                </div>
                                            </div>

                                            <div className="col-4 col-lg-1 mt-4 mt-lg-0">
                                                <i id="delete_cart_item" onClick={() => dispatch(removeItemFromCart(item.product))} className="fa fa-trash btn btn-danger"></i>
                                            </div>

                                        </div>
                                    </div>
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