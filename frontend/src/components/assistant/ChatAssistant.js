
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../../ChatAssistant.css";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addCartItem } from "../../actions/cartActions";
import { Html5Qrcode } from 'html5-qrcode';
import VoiceChat from "./VoiceChat.js";

// Payment Form Component
function PaymentForm({ onSubmit }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({});

  const validateAndSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate card number (basic check)
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = "Invalid card number";
    }

    // Validate expiry (MM/YY format)
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      newErrors.expiry = "Format: MM/YY";
    }

    // Validate CVV
    if (!cvv || cvv.length < 3) {
      newErrors.cvv = "Invalid CVV";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ cardNumber, expiry, cvv });
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="payment-form" style={{
      background: '#f9fafb',
      padding: '16px',
      borderRadius: '12px',
      margin: '12px 0'
    }}>
      <form onSubmit={validateAndSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Card Number
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            maxLength="19"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: errors.cardNumber ? '1px solid #EF4444' : '1px solid #D1D5DB',
              fontSize: '14px'
            }}
          />
          {errors.cardNumber && <span style={{ color: '#EF4444', fontSize: '12px' }}>{errors.cardNumber}</span>}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Expiry Date
            </label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              maxLength="5"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: errors.expiry ? '1px solid #EF4444' : '1px solid #D1D5DB',
                fontSize: '14px'
              }}
            />
            {errors.expiry && <span style={{ color: '#EF4444', fontSize: '12px' }}>{errors.expiry}</span>}
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              CVV
            </label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
              placeholder="123"
              maxLength="4"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: errors.cvv ? '1px solid #EF4444' : '1px solid #D1D5DB',
                fontSize: '14px'
              }}
            />
            {errors.cvv && <span style={{ color: '#EF4444', fontSize: '12px' }}>{errors.cvv}</span>}
          </div>
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            background: '#4F46E5',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          🔒 Complete Payment
        </button>
      </form>
    </div>
  );
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCodeRef, setHtml5QrCodeRef] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState("ta-IN");
  const recognitionRef = useRef(null);

  const { isAuthenticated } = useSelector(state => state.authState);
  const { items: cartItems } = useSelector(state => state.cartState);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setInput(voiceText);
    };

    recognitionRef.current = recognition;
  }, [lang]);

  function pushBot(text, extras = {}) {
    const botMessage = { sender: "bot", text, ...extras };
    setMessages(prev => [...prev, botMessage]);
    return botMessage;
  }

  // SEND MESSAGE (PARSE SEARCH)
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (!isAuthenticated) {
        pushBot("Please login to use the AI Shopping Assistant.");
        setIsLoading(false);
        setInput("");
        return;
      }

      const headers = sessionId ? { "x-session-id": sessionId } : {};
      const res = await axios.post(
        "/api/v1/sales/parse-search",
        { message: input, page: 1, limit: 6 },
        { headers, withCredentials: true }
      );

      const data = res.data;

      if (data.sessionId) setSessionId(data.sessionId);

      const items = (data.items || data.data || []).map(i => ({
        id: i.id || i._id,
        _id: i._id || i.id,
        source: i.source || "db",
        name: i.name || i.title,
        price: i.price,
        image:
          i.image ||
          (i.images && i.images[0] && (i.images[0].image || i.images[0].url)),
        description: i.description || i.short || ""
      }));

      if (data.intent === "search") {
        if (items.length > 0) {
          // Use the message from backend (Gemini) if available, otherwise fallback
          const replyText = data.message || `I found ${data.total || items.length} product(s) for "${data.query}":`;
          pushBot(replyText, { products: items });
        } else {
          pushBot(data.message || `No products found for "${data.query}".`);
        }
      } else {
        pushBot(data.message || "Try searching for a product.");
      }
    } catch (err) {
      console.error("Chat error:", err);
      pushBot("Error connecting to assistant. Try again.");
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  // SELECT PRODUCT — FIXED 400 ERROR
  const showProductDetailsInChat = async product => {
    setIsLoading(true);
    try {
      const payload = {
        selection: {
          id: product.id || product._id,
          source: product.source || "db"
        }
      };

      const headers = sessionId ? { "x-session-id": sessionId } : {};
      const { data } = await axios.post(
        "/api/v1/sales/select",
        payload,
        { headers }
      );

      const p = data.product || data.productData || data;

      if (!p) {
        pushBot("Could not fetch product details.");
        return;
      }

      const normalized = {
        id: p.id || p._id || p.productId,
        name: p.name || p.title,
        price: p.price ?? p.cost,
        images: p.images || [{ image: p.image }],
        description: p.description || p.short || ""
      };

      pushBot("", { productDetails: normalized });
    } catch (err) {
      console.error("select error:", err);
      pushBot("Error loading product details.");
    } finally {
      setIsLoading(false);
    }
  };

  // ADD TO CART — FIXED TO USE REDUX
  const addToCart = async (product, qty = 1) => {
    try {
      pushBot("Adding to cart...");

      // Use Redux action to add to cart (which updates localStorage)
      dispatch(addCartItem(product.id || product._id, qty));

      pushBot(
        `✅ Added ${product.name} to cart. Check your cart to proceed to checkout!`,
        { 
          cartConfirmation: { product, qty },
          showProceedButton: true 
        }
      );
    } catch (err) {
      console.error("add to cart error:", err);
      pushBot("Error adding to cart.");
    }
  };

  // PROCEED TO PAYMENT
  const proceedToPayment = async () => {
    setIsLoading(true);
    try {
      // Get cart items from Redux state (which syncs with localStorage)
      const currentCartItems = cartItems || [];
      
      if (currentCartItems.length === 0) {
        pushBot("Your cart is empty. Please add items first.");
        setIsLoading(false);
        return;
      }

      // Calculate subtotal
      const subtotal = currentCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Apply loyalty discount
      let loyaltyDiscount = 0;
      try {
        const loyaltyRes = await axios.post("/api/v1/loyalty/apply", { 
          cartItems: currentCartItems.map(item => ({
            productId: item.product,
            price: item.price,
            quantity: item.quantity
          }))
        });
        
        if (loyaltyRes.data && loyaltyRes.data.promotions) {
          loyaltyDiscount = loyaltyRes.data.promotions.discount || 0;
        }
      } catch (e) {
        console.log("Loyalty service unavailable, proceeding without discount");
      }

      const payable = subtotal - loyaltyDiscount;

      pushBot(
        `💰 Payment Summary:\n\nSubtotal: ₹${subtotal.toFixed(2)}\nLoyalty Discount: -₹${loyaltyDiscount.toFixed(2)}\n\n✨ Total Payable: ₹${payable.toFixed(2)}`,
        { 
          checkoutSummary: { 
            subtotal, 
            loyaltyDiscount, 
            payable,
            items: currentCartItems
          } 
        }
      );
    } catch (err) {
      console.error("payment summary error:", err);
      pushBot("Unable to prepare payment summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // PAYMENT FLOW
  const handlePayment = async (paymentDetails) => {
    setIsLoading(true);
    try {
      const currentCartItems = cartItems || [];
      const subtotal = currentCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Get loyalty discount
      let loyaltyDiscount = 0;
      try {
        const loyaltyRes = await axios.post("/api/v1/loyalty/apply", { 
          cartItems: currentCartItems.map(item => ({
            productId: item.product,
            price: item.price,
            quantity: item.quantity
          }))
        });
        loyaltyDiscount = loyaltyRes.data?.promotions?.discount || 0;
      } catch (e) {
        loyaltyDiscount = 0;
      }

      const payable = subtotal - loyaltyDiscount;

      // Start payment
      const paymentStart = await axios.post("/api/v1/sales/start-payment", {
        amount: payable
      });

      if (paymentStart.data.success) {
        // Complete payment with cart items
        const paymentComplete = await axios.post("/api/v1/sales/complete", {
          paymentId: paymentStart.data.paymentId,
          orderId: paymentStart.data.paymentId,
          cartItems: JSON.stringify(currentCartItems)
        });

        if (paymentComplete.data.success) {
          const orderId = paymentComplete.data.orderId || paymentComplete.data.order?._id || 'N/A';
          pushBot(`🎉 Order placed successfully! Order ID: ${orderId}`, {
            final: { 
              order: paymentComplete.data.order,
              orderId: orderId
            }
          });
          
          // Clear cart
          localStorage.removeItem('cartItems');
          dispatch({ type: 'cart/orderCompleted' });
        } else {
          pushBot("Payment completed but order creation failed. Please contact support.");
        }
      } else {
        pushBot("Payment failed. Please try again.");
      }
    } catch (err) {
      console.error("payment error:", err);
      pushBot("❌ Payment failed. Please check your card details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // BARCODE SCANNER
  const openScanner = async () => {
    if (isScanning) {
      // Stop scanning if already active
      await stopScanner();
      return;
    }

    const scannerDiv = document.getElementById('qr-reader');
    if (!scannerDiv) {
      console.error('QR reader div not found');
      pushBot('❌ Scanner component not found. Please refresh the page.');
      return;
    }

    try {
      setIsScanning(true);
      scannerDiv.style.display = 'block';
      pushBot('📷 Opening camera... Please allow camera access when prompted.');
      pushBot('📌 Tips:\n• Hold barcode 10-15cm from camera\n• Ensure good lighting\n• Keep barcode horizontal\n• Wait for green scanning box');

      console.log('Initializing Html5Qrcode scanner...');
      const html5QrCode = new Html5Qrcode('qr-reader');
      setHtml5QrCodeRef(html5QrCode);

      let isProcessing = false;
      
      console.log('Starting camera...');
      await html5QrCode.start(
        { facingMode: 'environment' },
        { 
          fps: 10, 
          qrbox: { width: 300, height: 150 },
          aspectRatio: 2.0,
          disableFlip: false,
          formatsToSupport: [0, 8, 11, 12, 13] // CODE_128, CODE_39, CODE_93, EAN_13, EAN_8
        },
        async (decodedText) => {
          // Prevent multiple scans
          if (isProcessing) return;
          isProcessing = true;
          
          // Stop scanner immediately
          await stopScanner();
          
          // Process the scanned barcode
          try {
            pushBot(`🔍 Scanning barcode: ${decodedText}...`);
            
            const { data } = await axios.get(`/api/v1/barcode/${encodeURIComponent(decodedText)}`);
            
            if (data.success && data.product) {
              pushBot(data.reply || 'Product found!', { productDetails: data.product });
            } else {
              pushBot('Product not found for scanned code');
            }
          } catch (err) {
            console.error('Barcode lookup error:', err);
            pushBot('Product not found for scanned code');
          }
        },
        (err) => {
          // parsing error - ignore
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setIsScanning(false);
      
      if (scannerDiv) {
        scannerDiv.style.display = 'none';
      }

      if (err.name === 'NotAllowedError') {
        pushBot('❌ Camera access denied. Please allow camera permissions in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        pushBot('❌ No camera found on your device.');
      } else if (err.name === 'NotReadableError') {
        pushBot('❌ Camera is already in use by another application.');
      } else if (err.name === 'NotSupportedError') {
        pushBot('❌ Your browser doesn\'t support camera access. Please try Chrome, Firefox, or Safari.');
      } else {
        pushBot(`❌ Failed to start camera: ${err.message || 'Unknown error'}. Please check permissions and try again.`);
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef) {
      try {
        await html5QrCodeRef.stop();
        html5QrCodeRef.clear();
      } catch (e) {
        console.log('Stop error:', e);
      }
      setHtml5QrCodeRef(null);
    }
    
    setIsScanning(false);
    const scannerDiv = document.getElementById('qr-reader');
    if (scannerDiv) {
      scannerDiv.style.display = 'none';
    }
  };

  // UPLOAD BARCODE IMAGE
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    pushBot('📤 Scanning uploaded barcode image...');

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      
      pushBot(`🔍 Found barcode: ${decodedText}`);
      
      // Lookup product
      const { data } = await axios.get(`/api/v1/barcode/${encodeURIComponent(decodedText)}`);
      
      if (data.success && data.product) {
        pushBot(data.reply || 'Product found!', { productDetails: data.product });
      } else {
        pushBot('Product not found for scanned code');
      }
    } catch (err) {
      console.error('File scan error:', err);
      pushBot('❌ Could not read barcode from image. Please ensure the image is clear and contains a valid barcode.');
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // SEND BARCODE TO ASSISTANT (Alternative method using assistant API)
  const sendBarcodeToChatAssistant = async (scannedCode) => {
    try {
      pushBot(`🔍 Looking up barcode: ${scannedCode}...`);
      
      const response = await axios.post("/api/v1/assistant", {
        message: {
          type: "barcode_scan",
          data: scannedCode
        }
      });

      if (response.data.success) {
        pushBot(response.data.reply);
        if (response.data.product) {
          pushBot('', { productDetails: response.data.product });
        }
      } else {
        pushBot('Product not found for this barcode');
      }
    } catch (err) {
      console.error('Assistant barcode error:', err);
      pushBot('Error processing barcode');
    }
  };

  // RENDER MESSAGE
  function renderMessage(msg, idx) {
    if (msg.products?.length) {
      return (
        <div key={idx}>
          <div className="chat-message bot">{msg.text}</div>
          <div className="product-cards">
            {msg.products.map(p => (
              <div key={p.id} className="product-card">
                <img
                  src={p.image || "https://via.placeholder.com/80"}
                  alt={p.name}
                />
                <div className="product-info">
                  <h4>{p.name}</h4>
                  <p>₹{p.price}</p>
                  <div className="product-actions">
                    <button onClick={() => showProductDetailsInChat(p)}>
                      View Details
                    </button>
                    <button onClick={() => addToCart(p)}>Add to Cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (msg.productDetails) {
      const p = msg.productDetails;
      return (
        <div key={idx}>
          <div className="chat-message bot">
            <strong>{p.name}</strong>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <img
                src={p.images?.[0]?.image || "https://via.placeholder.com/120"}
                alt={p.name}
                style={{ width: 120, height: 120, objectFit: "cover" }}
              />
              <div>
                <p>₹{p.price}</p>
                <p style={{ maxWidth: 320 }}>{p.description}</p>
                <button onClick={() => addToCart(p)}>Add to Cart</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (msg.showProceedButton) {
      return (
        <div key={idx}>
          <div className="chat-message bot">{msg.text}</div>
          <div className="chat-message bot" style={{ background: 'transparent', padding: 0 }}>
            <button 
              onClick={proceedToPayment}
              style={{
                background: '#4F46E5',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginTop: '8px'
              }}
            >
              💳 Proceed to Payment
            </button>
          </div>
        </div>
      );
    }

    if (msg.checkoutSummary) {
      const s = msg.checkoutSummary;
      return (
        <div key={idx}>
          <div className="chat-message bot" style={{ whiteSpace: 'pre-line' }}>
            {msg.text}
          </div>
          <div className="chat-message bot" style={{ background: 'transparent', padding: 0 }}>
            <button
              onClick={() =>
                pushBot("Please enter your card details below:", { requestPayment: true })
              }
              style={{
                background: '#10B981',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              ✅ Confirm Payment
            </button>
          </div>
        </div>
      );
    }

    if (msg.requestPayment) {
      return (
        <div key={idx}>
          <div className="chat-message bot">{msg.text}</div>
          <PaymentForm onSubmit={handlePayment} />
        </div>
      );
    }

    if (msg.final) {
      const order = msg.final.order;
      const orderId = msg.final.orderId || order?.orderId || order?._id;
      return (
        <div key={idx}>
          <div className="chat-message bot">
            {msg.text}
          </div>
          <div className="chat-message bot" style={{ background: 'transparent', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/orders');
              }}
              style={{
                background: '#4F46E5',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              📦 Track Now
            </button>
            <button
              onClick={() => {
                window.open('https://t.me/shop_assistant_123_bot', '_blank');
              }}
              style={{
                background: '#0088cc',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              📱 Join Telegram for Updates
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={idx}>
        <div className={`chat-message ${msg.sender}`}>{msg.text}</div>
      </div>
    );
  }

  const user = useSelector((state) => state.authState.user);
  
  // Don't show chatbot for admin users
  if (user && (user.role === 'admin' || user.role === 'merchant_admin')) {
    return null;
  }

  return (
    <>
      <button className="chat-float-btn" onClick={() => setIsOpen(!isOpen)}>
        💬
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <strong>🤖 AI Shopping Assistant</strong>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={openScanner} 
                style={{ 
                  background: isScanning ? '#EF4444' : '#10B981',
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 14px', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  minWidth: '90px'
                }}
              >
                <span style={{ fontSize: '16px' }}>{isScanning ? '⏹' : '📷'}</span>
                {isScanning ? 'Stop' : 'Scan'}
              </button>
              <input 
                type="file" 
                id="barcode-upload" 
                accept="image/*" 
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => document.getElementById('barcode-upload').click()}
                style={{ 
                  background: '#3B82F6',
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 14px', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  minWidth: '90px'
                }}
              >
                <span style={{ fontSize: '16px' }}>📤</span>
                Upload
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '6px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >
                ✖
              </button>
            </div>
          </div>

          <div className="chat-body">
            <div className="lang-select">
              <select value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="ta-IN">தமிழ்</option>
                <option value="hi-IN">हिंदी</option>
                <option value="en-US">English</option>
              </select>
            </div>
            <div id="qr-reader" style={{ width: '100%', marginBottom: '12px', display: 'none', borderRadius: '8px', overflow: 'hidden' }}></div>
            {messages.length === 0 && (
              <div className="chat-welcome">
                <p>Ask me:</p>
                <ul>
                  <li>"Show me laptops"</li>
                  <li>"Find phones under 30000"</li>
                </ul>
              </div>
            )}

            {messages.map((m, idx) => renderMessage(m, idx))}

            {isLoading && (
              <div className="chat-message bot">
                <span className="typing-indicator">●●●</span>
              </div>
            )}
          </div>

          <div className="chat-footer">
            <input
              type="text"
              placeholder="Ask..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isLoading && sendMessage()}
              disabled={isLoading}
            />
            <button onClick={sendMessage} disabled={isLoading}>
              {isLoading ? "..." : "Send"}
            </button>
            <button
              onClick={() => recognitionRef.current?.start()}
              className="mic-btn"
              title="Voice Input"
              disabled={isLoading}
            >
              {isListening ? "🎙" : "🎤"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
