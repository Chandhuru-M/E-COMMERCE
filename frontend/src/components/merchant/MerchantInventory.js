import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loader from '../layouts/Loader';
import MetaData from '../layouts/MetaData';
import MerchantSidebar from './MerchantSidebar';

export default function MerchantInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await axios.get('/api/v1/products');
      setProducts(data.products || []);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const deleteHandler = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`/api/v1/admin/product/${id}`);
      toast.success('Product deleted successfully');
      fetchInventory(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="row m-0">
      <MetaData title={'Inventory Management'} />
      <div className="col-12 col-md-auto p-0">
          <MerchantSidebar/>
      </div>
      
      <div className="col-12 col-md">
        <div className="container container-fluid">
          <div className="d-flex justify-content-between align-items-center my-4">
            <h1>Product Inventory</h1>
            <Link to="/merchant/product/new" className="btn btn-primary btn-sm" style={{ width: 'auto', minWidth: 'auto', display: 'inline-flex', alignItems: 'center', flexGrow: 0, marginLeft: '20px', whiteSpace: 'nowrap' }}>
              <i className="fa fa-plus mr-1"></i> Add New Product
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-box-open fa-3x text-muted mb-3"></i>
              <p className="lead">No products yet</p>
              <Link to="/merchant/product/new" className="btn btn-primary">
                <i className="fa fa-plus"></i> Create Your First Product
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover admin-table">
                <thead className="thead-dark">
                  <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Barcode</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}>
                      <td>
                        <img 
                          src={product.images?.[0]?.image || '/images/default_product.png'} 
                          alt={product.name}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                        <br />
                        <small className="text-muted">{product.category}</small>
                      </td>
                      <td>
                        {product.barcode ? (
                          <span className="badge badge-secondary">{product.barcode}</span>
                        ) : (
                          <span className="text-muted">No barcode</span>
                        )}
                      </td>
                      <td><strong>${product.price?.toFixed(2)}</strong></td>
                      <td>
                        <span className={product.stock > 10 ? 'text-success' : product.stock > 0 ? 'text-warning' : 'text-danger'}>
                          <strong>{product.stock}</strong> units
                        </span>
                      </td>
                      <td>
                        {product.stock === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : product.stock < 10 ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex">
                          <Link 
                            to={`/merchant/product/${product._id}`} 
                            className="btn btn-sm btn-primary mr-2"
                            title="Edit Product"
                          >
                            <i className="fa fa-pencil-alt mr-1"></i> Edit
                          </Link>
                          <button 
                            onClick={() => deleteHandler(product._id)}
                            className="btn btn-sm btn-danger"
                            title="Delete Product"
                          >
                            <i className="fa fa-trash mr-1"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
