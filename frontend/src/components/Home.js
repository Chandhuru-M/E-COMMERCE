import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProducts } from "../actions/productActions";
import { Link, useNavigate } from "react-router-dom";
import Loader from "./layouts/Loader";
import MetaData from "./layouts/MetaData";
import Product from "./product/Product";
import  {toast} from 'react-toastify';
import axios from 'axios';

export  default function Home(){
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {products, loading, error, productsCount, resPerPage} = useSelector((state) => state.productsState)
    const { isAuthenticated, user } = useSelector(state => state.authState);
    const [currentPage, setCurrentPage] = useState(1);
    const [allProducts, setAllProducts] = useState([]);
    const [isFakeStore, setIsFakeStore] = useState(false);
    const [fakeStoreProducts, setFakeStoreProducts] = useState([]);
    const [loadingMore, setLoadingMore] = useState(false);
    const [endOfDb, setEndOfDb] = useState(false);

    useEffect(()=>{
        // Redirect admin to their dashboard
        if (isAuthenticated && user && user.role === 'admin') {
            navigate('/admin/dashboard');
            return;
        }
        
        // Redirect merchant to their dashboard
        if (isAuthenticated && user && user.role === 'merchant_admin') {
            navigate('/merchant/dashboard');
            return;
        }
        
        if(error) {
            return toast.error(error,{
                position: toast.POSITION.BOTTOM_CENTER
            })
        }
        
        // Initial load
        if(currentPage === 1 && !isFakeStore) {
             dispatch(getProducts(null, null, null, null, 1));
        }
    }, [error, dispatch, isAuthenticated, user, navigate]);

    // Update local state when Redux products change
    useEffect(() => {
        if (products && !isFakeStore) {
            if (currentPage === 1) {
                setAllProducts(products);
            } else {
                // Append new products if they are not already in the list
                setAllProducts(prev => {
                    const newProducts = products.filter(p => !prev.some(existing => existing._id === p._id));
                    return [...prev, ...newProducts];
                });
            }
            
            // If we received fewer products than page size, we are done with DB
            if (products.length < (resPerPage || 8)) {
                setEndOfDb(true);
            }

            setLoadingMore(false);
        }
    }, [products, currentPage, isFakeStore, resPerPage]);

    const loadMore = async () => {
        setLoadingMore(true);
        
        // Check if we have more DB products
        if (!isFakeStore && !endOfDb && productsCount > allProducts.length) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            dispatch(getProducts(null, null, null, null, nextPage));
        } else {
            // Switch to FakeStore or load more from FakeStore
            setIsFakeStore(true);
            try {
                // Fetch from FakeStore
                // We'll fetch all and slice locally or fetch limit if API supports offset (FakeStore API is simple)
                // FakeStore API: https://fakestoreapi.com/products
                
                if (fakeStoreProducts.length === 0) {
                    // Use fetch instead of axios to avoid potential config issues
                    const response = await fetch('https://fakestoreapi.com/products');
                    
                    if (!response.ok) {
                        throw new Error(`External API Error: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    
                    // Transform to match our product shape
                    const transformed = data.map(p => ({
                        _id: `fake_${p.id}`,
                        name: p.title,
                        price: p.price,
                        description: p.description,
                        ratings: p.rating.rate,
                        images: [{ image: p.image }],
                        category: p.category,
                        seller: 'FakeStore',
                        numOfReviews: p.rating.count,
                        stock: 100
                    }));
                    setFakeStoreProducts(transformed);
                    
                    // Add first batch (e.g., 8 items)
                    setAllProducts(prev => [...prev, ...transformed.slice(0, 8)]);
                } else {
                    // Add next batch from already fetched fake products
                    const currentCount = allProducts.filter(p => p._id.toString().startsWith('fake_')).length;
                    const nextBatch = fakeStoreProducts.slice(currentCount, currentCount + 8);
                    
                    if (nextBatch.length > 0) {
                        setAllProducts(prev => [...prev, ...nextBatch]);
                    } else {
                        toast.info("No more products to load", { position: toast.POSITION.BOTTOM_CENTER });
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error(`Failed to load more products: ${err.message}`);
            }
            setLoadingMore(false);
        }
    };

    return (
        <Fragment>
            {loading && currentPage === 1 ? <Loader/>:
                <Fragment>
                    <MetaData title={'Buy Best Products'} />
                    <h1 id="products_heading">Latest Products</h1>
                    <section id="products" className="container mt-5">
                        <div className="row justify-content-center">
                            { allProducts && allProducts.map(product => (
                                <Product col={3} key={product._id}  product={product}/>
                            ))}
                        
                        </div>
                    </section>
                    
                    <div className="d-flex justify-content-center mt-5 mb-5">
                        <button 
                            id="load_more_btn"
                            className="btn btn-primary" 
                            onClick={loadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <>
                                    <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                    Loading...
                                </>
                            ) : (
                                'Show More'
                            )}
                        </button>
                    </div>
                </Fragment>
           }
        </Fragment>
    )
}