import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getProduct, updateProduct } from "../../actions/productActions";
import { clearError, clearProductUpdated } from "../../slices/productSlice";
import { toast } from "react-toastify";

export default function MerchantUpdateProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState(0);
  const [seller, setSeller] = useState("");
  const [images, setImages] = useState([]);
  const [imagesCleared, setImagesCleared] = useState(false);
  const [imagesPreview, setImagesPreview] = useState([]);
  const [barcode, setBarcode] = useState("");

  const { id: productId } = useParams();
  const { loading, isProductUpdated, error, product } = useSelector(state => state.productState);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const categories = [
    'Electronics',
    'Mobile Phones',
    'Laptops',
    'Accessories',
    'Headphones',
    'Food',
    'Books',
    'Clothes/Shoes',
    'Beauty/Health',
    'Sports',
    'Outdoor',
    'Home'
  ];

  const onImagesChange = (e) => {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.readyState === 2) {
          setImagesPreview(oldArray => [...oldArray, reader.result]);
          setImages(oldArray => [...oldArray, file]);
        }
      }

      reader.readAsDataURL(file);
    });
  }

  const submitHandler = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('description', description);
    formData.append('seller', seller);
    formData.append('category', category);
    formData.append('barcode', barcode);
    formData.append('imagesCleared', imagesCleared);
    images.forEach(image => {
      formData.append('images', image);
    });
    dispatch(updateProduct(productId, formData));
  }

  const clearImagesHandler = () => {
    setImages([]);
    setImagesPreview([]);
    setImagesCleared(true);
  }

  useEffect(() => {
    if (isProductUpdated) {
      toast('Product Updated Successfully!', {
        type: 'success',
        position: toast.POSITION.BOTTOM_CENTER,
        onOpen: () => dispatch(clearProductUpdated())
      });
      navigate('/merchant/inventory');
      setImages([]);
      return;
    }

    if (error) {
      toast(error, {
        position: toast.POSITION.BOTTOM_CENTER,
        type: 'error',
        onOpen: () => { dispatch(clearError()) }
      });
      return;
    }
    dispatch(getProduct(productId));
  }, [isProductUpdated, error, dispatch, productId, navigate]);

  useEffect(() => {
    if (product._id) {
      setName(product.name);
      setPrice(product.price);
      setStock(product.stock);
      setDescription(product.description);
      setSeller(product.seller);
      setCategory(product.category);
      setBarcode(product.barcode || "");

      let images = [];
      product.images?.forEach(image => {
        images.push(image.image);
      });
      setImagesPreview(images);
    }
  }, [product]);

  return (
    <div className="container container-fluid">
      <Fragment>
        <div className="wrapper my-5">
          <form onSubmit={submitHandler} className="shadow-lg" encType='multipart/form-data'>
            <h1 className="mb-4">Update Product</h1>

            <div className="form-group">
              <label htmlFor="name_field">Product Name</label>
              <input
                type="text"
                id="name_field"
                className="form-control"
                onChange={e => setName(e.target.value)}
                value={name}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price_field">Price ($)</label>
              <input
                type="text"
                id="price_field"
                className="form-control"
                onChange={e => setPrice(e.target.value)}
                value={price}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description_field">Description</label>
              <textarea
                className="form-control"
                id="description_field"
                rows="8"
                onChange={e => setDescription(e.target.value)}
                value={description}
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="category_field">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="form-control" id="category_field" required>
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="stock_field">Stock Quantity</label>
              <input
                type="number"
                id="stock_field"
                className="form-control"
                onChange={e => setStock(e.target.value)}
                value={stock}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="seller_field">Seller Name</label>
              <input
                type="text"
                id="seller_field"
                className="form-control"
                onChange={e => setSeller(e.target.value)}
                value={seller}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="barcode_field">Barcode</label>
              <input
                type="text"
                id="barcode_field"
                className="form-control"
                onChange={e => setBarcode(e.target.value)}
                value={barcode}
                placeholder="e.g., PRD0001"
              />
            </div>

            <div className='form-group'>
              <label>Product Images</label>

              <div className='custom-file'>
                <input
                  type='file'
                  name='product_images'
                  className='custom-file-input'
                  id='customFile'
                  multiple
                  onChange={onImagesChange}
                />

                <label className='custom-file-label' htmlFor='customFile'>
                  Choose Images
                </label>
              </div>

              {imagesPreview.length > 0 && !imagesCleared && (
                <Fragment>
                  <button className="btn btn-danger btn-sm mt-2 mb-2" onClick={clearImagesHandler}>
                    <i className="fa fa-trash"></i> Clear All Images
                  </button>
                  <div className="mt-2">
                    {imagesPreview.map((image, index) => (
                      <img
                        className="mr-2"
                        key={index}
                        src={image}
                        alt={`Product Preview ${index}`}
                        width="55"
                        height="52"
                      />
                    ))}
                  </div>
                </Fragment>
              )}

              {images.length > 0 && (
                <div className="mt-2">
                  <span className="text-success">{images.length} new image(s) selected</span>
                </div>
              )}
            </div>

            <button
              id="login_button"
              type="submit"
              disabled={loading}
              className="btn btn-block py-3"
            >
              {loading ? 'Updating...' : 'UPDATE PRODUCT'}
            </button>

          </form>
        </div>
      </Fragment>
    </div>
  )
}
