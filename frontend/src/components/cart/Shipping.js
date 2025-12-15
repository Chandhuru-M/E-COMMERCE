import { useDispatch, useSelector } from "react-redux";
import { Fragment, useState, useEffect } from "react";
import {countries} from 'countries-list'
import { saveShippingInfo, addCartItemSuccess } from "../../slices/cartSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import CheckoutSteps from "./CheckoutStep";
import { toast } from "react-toastify";
import axios from 'axios';

export const validateShipping = (shippingInfo, navigate) => {
   
    if(
        !shippingInfo.address||
        !shippingInfo.city||
        !shippingInfo.state|| 
        !shippingInfo.country||
        !shippingInfo.phoneNo||
        !shippingInfo.postalCode
        ) {
            toast.error('Please fill the shipping information',{position: toast.POSITION.BOTTOM_CENTER})
            navigate('/shipping')
    }
} 


export default function Shipping() {
    const {shippingInfo={}, items } = useSelector(state => state.cartState)
    const {user} = useSelector(state => state.authState)

    const [address, setAddress] = useState(shippingInfo.address || '');
    const [city, setCity] = useState(shippingInfo.city || '');
    const [phoneNo, setPhoneNo] = useState(shippingInfo.phoneNo || '');
    const [postalCode, setPostalCode] = useState(shippingInfo.postalCode || '');
    const [country, setCountry] = useState(shippingInfo.country || '');
    const [state, setState] = useState(shippingInfo.state || '');
    const countryList =  Object.values(countries);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Load Telegram cart whenever entering shipping page
    useEffect(() => {
        loadTelegramCart();
    }, [user]);

    const loadTelegramCart = async () => {
        try {
            const { data } = await axios.get('/api/v1/me', { withCredentials: true });
            const telegramCart = data.user.telegramCart || [];
            
            console.log('📱 Telegram cart items from database:', telegramCart);
            
            if (telegramCart.length > 0) {
                // Check if cart already has items - don't duplicate
                if (items && items.length > 0) {
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
                
                console.log('✅ Cart loaded from Telegram!');
            }
        } catch (error) {
            console.error('❌ Error loading Telegram cart:', error);
        }
    };

    const submitHandler = (e) => {
        e.preventDefault();
        dispatch(saveShippingInfo({address, city, phoneNo, postalCode, country, state}))
        navigate('/order/confirm')
    }





    return (
        <Fragment>
            <CheckoutSteps shipping />
            <div className="row wrapper">
                    <div className="col-10 col-lg-5">
                        <form onSubmit={submitHandler} className="shadow-lg">
                            <h1 className="mb-4">Shipping Info</h1>
                            <div className="form-group">
                                <label htmlFor="address_field">Address</label>
                                <input
                                    type="text"
                                    id="address_field"
                                    className="form-control"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="city_field">City</label>
                                <input
                                    type="text"
                                    id="city_field"
                                    className="form-control"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone_field">Phone No</label>
                                <input
                                    type="phone"
                                    id="phone_field"
                                    className="form-control"
                                    value={phoneNo}
                                    onChange={(e) => setPhoneNo(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="postal_code_field">Postal Code</label>
                                <input
                                    type="number"
                                    id="postal_code_field"
                                    className="form-control"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="country_field">Country</label>
                                <select
                                    id="country_field"
                                    className="form-control"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    required

                                >{ countryList.map((country, i) => (

                                    <option key={i} value={country.name}>
                                        {country.name}
                                    </option>
                                ))
                                }
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="state_field">State</label>
                                <input
                                    type="text"
                                    id="state_field"
                                    className="form-control"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                id="shipping_btn"
                                type="submit"
                                className="btn btn-block py-3"
                            >
                                CONTINUE
                                </button>
                        </form>
                    </div>
            </div>
        </Fragment>
    )
}