import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import './POSSystem.css';

const POSSystem = () => {
  const [cart, setCart] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [merchantId, setMerchantId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const html5QrCodeRef = useRef(null);
  const { user } = useSelector(state => state.authState);

  useEffect(() => {
    // For testing: allow manual merchant ID or use user's ID
    const storedMerchantId = localStorage.getItem('merchantId');
    if (storedMerchantId) {
      setMerchantId(storedMerchantId);
    } else if (user && user._id) {
      // Use user ID as merchant ID for now
      setMerchantId(user._id);
      localStorage.setItem('merchantId', user._id);
    }
  }, [user]);

  const openScanner = async () => {
    if (isProcessing) return;
    
    try {
      const html5QrCode = new Html5Qrcode("pos-barcode-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 2.0,
          formatsToSupport: [0, 8, 11, 12, 13]
        },
        async (decodedText) => {
          if (isProcessing) return;
          setIsProcessing(true);

          try {
            await html5QrCode.stop();
            setIsScanning(false);
            await scanBarcode(decodedText);
          } catch (err) {
            console.error('Scanner stop error:', err);
          } finally {
            setIsProcessing(false);
          }
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      
      if (err.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        toast.error('Camera is being used by another application.');
      } else {
        toast.error('Failed to access camera: ' + err.message);
      }
      
      setIsProcessing(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
      setIsProcessing(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("pos-barcode-reader");
    
    try {
      const result = await html5QrCode.scanFile(file, true);
      await scanBarcode(result);
    } catch (err) {
      toast.error('Failed to scan barcode from image');
      console.error('File scan error:', err);
    }
  };

  const scanBarcode = async (barcode) => {
    if (!merchantId) {
      toast.error('Merchant ID is required');
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const { data } = await axios.post('/api/v1/pos/scan', {
        barcode,
        merchantId
      }, config);

      if (data.success) {
        setCart(data.cart.items || []);
        toast.success(`Added: ${data.product.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to scan barcode');
    }
  };

  const removeItem = async (productId) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const { data } = await axios.post('/api/v1/pos/remove', {
        productId,
        merchantId
      }, config);

      if (data.success) {
        setCart(data.cart.items || []);
        toast.success('Item removed from cart');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const lookupCustomer = async () => {
    if (!customerEmail) {
      toast.error('Please enter customer email');
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const { data } = await axios.get(`/api/v1/lookup?email=${customerEmail}`, config);
      if (data.success && data.user) {
        setCustomerInfo(data.user);
        const points = data.user.loyaltyPoints || 0;
        toast.success(`✓ Customer: ${data.user.name} - ${points} loyalty points available`);
      } else {
        toast.warning('Customer not found. Sale will proceed as walk-in customer.');
        setCustomerInfo(null);
      }
    } catch (err) {
      console.error('Lookup error:', err);
      if (err.response?.status === 404) {
        toast.warning('Customer not found. Creating walk-in sale.');
      } else if (err.response?.status === 401) {
        toast.error('Authentication required. Please login again.');
      } else {
        toast.info('Customer lookup unavailable. Proceeding as walk-in sale.');
      }
      setCustomerInfo(null);
    }
  };

  const initiateCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPaymentModal(true);
    const total = calculateTotal();
    setAmountReceived(total.toString());
    setUseLoyaltyPoints(false);
    setLoyaltyDiscount(0);
  };

  const cancelPayment = () => {
    setShowPaymentModal(false);
    setPaymentMethod('cash');
    setAmountReceived('');
    setUseLoyaltyPoints(false);
    setLoyaltyDiscount(0);
  };

  const processPayment = async () => {
    const finalTotal = calculateFinalTotal();
    const received = parseFloat(amountReceived);

    if (!amountReceived || isNaN(received)) {
      toast.error('Please enter amount received');
      return;
    }

    if (received < finalTotal) {
      toast.error(`Insufficient amount. Required: $${finalTotal.toFixed(2)}`);
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const { data } = await axios.post('/api/v1/pos/checkout', {
        merchantId,
        paymentMethod,
        customerEmail: customerEmail || null,
        customerId: customerInfo?._id || null,
        amountReceived: received
      }, config);

      if (data.success) {
        const change = received - finalTotal;
        
        // Show payment success
        toast.success(`✓ Payment Successful! Order #${data.order._id.slice(-8)}`);
        
        if (paymentMethod === 'cash' && change > 0) {
          toast.info(`Change to return: $${change.toFixed(2)}`);
        }
        
        if (loyaltyDiscount > 0) {
          toast.success(`Loyalty discount applied: $${loyaltyDiscount.toFixed(2)}`);
        }
        
        if (customerInfo) {
          toast.success(`Order linked to ${customerInfo.name}`);
        }

        // Reset all states
        setCart([]);
        setCustomerEmail('');
        setCustomerInfo(null);
        setShowPaymentModal(false);
        setPaymentMethod('cash');
        setAmountReceived('');
        setUseLoyaltyPoints(false);
        setLoyaltyDiscount(0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateTotal();
    return Math.max(0, subtotal - loyaltyDiscount);
  };

  const handleLoyaltyToggle = (checked) => {
    setUseLoyaltyPoints(checked);
    if (checked && customerInfo) {
      // $1 discount per 100 loyalty points (1 point = $0.01 discount)
      const maxDiscount = (customerInfo.loyaltyPoints || 0) * 0.01;
      const subtotal = calculateTotal();
      const discount = Math.min(maxDiscount, subtotal); // Can't discount more than total
      setLoyaltyDiscount(discount);
      const finalTotal = subtotal - discount;
      setAmountReceived(finalTotal.toFixed(2));
    } else {
      setLoyaltyDiscount(0);
      setAmountReceived(calculateTotal().toFixed(2));
    }
  };

  return (
    <div className="pos-container">
      <div className="pos-header">
        <h2><i className="fa fa-barcode"></i> Point of Sale System</h2>
        <div className="merchant-info">
          <small className="text-muted d-block mb-1">Merchant/Staff ID: {merchantId?.slice(0, 8)}...</small>
          {user && <span className="badge badge-success">Logged in as: {user.name}</span>}
        </div>
      </div>

      {/* Customer Lookup Section */}
      <div className="pos-customer-section">
        <h5><i className="fa fa-user"></i> Customer Lookup (Optional)</h5>
        <p className="text-muted small mb-2">
          Enter registered customer email to link order and apply loyalty points. Leave empty for walk-in sales.
        </p>
        <div className="customer-lookup">
          <input 
            type="email" 
            value={customerEmail} 
            onChange={(e) => setCustomerEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && lookupCustomer()}
            placeholder="e.g., customer@example.com"
            className="form-control"
            style={{ flex: 1, marginRight: '10px' }}
          />
          <button onClick={lookupCustomer} className="btn btn-info" disabled={!customerEmail}>
            <i className="fa fa-search"></i> Lookup
          </button>
          {customerEmail && (
            <button 
              onClick={() => {
                setCustomerEmail('');
                setCustomerInfo(null);
              }} 
              className="btn btn-secondary"
            >
              <i className="fa fa-times"></i> Clear
            </button>
          )}
        </div>
        {customerInfo ? (
          <div className="customer-info-card">
            <div className="customer-info-main">
              <i className="fa fa-check-circle text-success"></i> 
              <strong>{customerInfo.name}</strong> ({customerInfo.email})
              <span className="badge badge-success ml-2">Verified</span>
            </div>
            {customerInfo.loyaltyPoints > 0 && (
              <div className="customer-loyalty-badge">
                <i className="fa fa-star text-warning"></i>
                <span><strong>{customerInfo.loyaltyPoints}</strong> loyalty points</span>
              </div>
            )}
          </div>
        ) : customerEmail && (
          <div className="text-muted small mt-2">
            <i className="fa fa-info-circle"></i> Click "Lookup" to verify customer or proceed without lookup for walk-in sale
          </div>
        )}
      </div>

      <div className="pos-scanner-section">
        <div id="pos-barcode-reader" className="barcode-reader"></div>
        
        <div className="scanner-controls">
          {!isScanning ? (
            <button 
              onClick={openScanner} 
              className="btn btn-scan"
              disabled={!merchantId}
            >
              Scan Barcode
            </button>
          ) : (
            <button 
              onClick={stopScanner} 
              className="btn btn-stop"
            >
              Stop Scanning
            </button>
          )}
          
          <label className="btn btn-upload">
            Upload Barcode Image
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={!merchantId}
            />
          </label>
        </div>
      </div>

      <div className="pos-cart">
        <h3>Cart ({cart.length} items)</h3>
        
        {cart.length === 0 ? (
          <p className="empty-cart">Cart is empty. Scan items to add.</p>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="item-details">
                    <span className="item-name">{item.productId?.name || 'Product'}</span>
                    <span className="item-quantity">Qty: {item.quantity}</span>
                  </div>
                  <div className="item-price">
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                    <button 
                      onClick={() => removeItem(item.productId?._id)}
                      className="btn-remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-total">
              <h4>Total: ${calculateTotal().toFixed(2)}</h4>
            </div>

            <button 
              onClick={initiateCheckout}
              className="btn btn-checkout"
            >
              Proceed to Payment
            </button>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <h3><i className="fa fa-credit-card"></i> Process Payment</h3>
              <button className="close-btn" onClick={cancelPayment}>×</button>
            </div>

            <div className="payment-modal-body">
              <div className="payment-summary">
                <h4>Order Summary</h4>
                <div className="summary-row">
                  <span>Items:</span>
                  <span>{cart.length} items</span>
                </div>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                {customerInfo && (
                  <div className="summary-row customer-linked">
                    <i className="fa fa-user-check"></i>
                    <span>Customer: {customerInfo.name}</span>
                  </div>
                )}
                {customerInfo && customerInfo.loyaltyPoints > 0 && (
                  <div className="loyalty-section">
                    <div className="loyalty-points-display">
                      <i className="fa fa-star text-warning"></i>
                      <span><strong>{customerInfo.loyaltyPoints}</strong> Loyalty Points Available</span>
                      <small className="text-muted d-block">1 point = $0.01 discount</small>
                    </div>
                    <label className="loyalty-checkbox">
                      <input 
                        type="checkbox"
                        checked={useLoyaltyPoints}
                        onChange={(e) => handleLoyaltyToggle(e.target.checked)}
                      />
                      <span>Apply loyalty discount (Max: ${(customerInfo.loyaltyPoints * 0.01).toFixed(2)})</span>
                    </label>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="summary-row discount-row">
                    <span><i className="fa fa-tag"></i> Loyalty Discount:</span>
                    <span className="text-success">-${loyaltyDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row final-total">
                  <span><strong>Total Amount:</strong></span>
                  <span className="total-amount">${calculateFinalTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="payment-method-section">
                <h5>Payment Method</h5>
                <div className="payment-methods">
                  <label className={`payment-option ${paymentMethod === 'cash' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      value="cash" 
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-option-content">
                      <i className="fa fa-money-bill-wave"></i>
                      <span>Cash</span>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      value="upi" 
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-option-content">
                      <i className="fa fa-mobile-alt"></i>
                      <span>UPI</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="amount-section">
                <label>Amount Received ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  min={calculateFinalTotal()}
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="Enter amount received"
                  className="form-control amount-input"
                />
                {amountReceived && parseFloat(amountReceived) > calculateFinalTotal() && (
                  <div className="change-display">
                    <i className="fa fa-info-circle"></i> 
                    Change: ${(parseFloat(amountReceived) - calculateFinalTotal()).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            <div className="payment-modal-footer">
              <button className="btn btn-cancel" onClick={cancelPayment}>
                <i className="fa fa-times"></i> Cancel
              </button>
              <button className="btn btn-confirm-payment" onClick={processPayment}>
                <i className="fa fa-check"></i> Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSSystem;
