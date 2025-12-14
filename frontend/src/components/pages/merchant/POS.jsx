// // frontend/src/pages/POS.jsx
// import React, { useState } from 'react';
// import axios from 'axios';
// import io from 'socket.io-client';


// const socket = io(/* server origin default */);


// export default function POSPage(){
// const [barcode, setBarcode] = useState('');
// const [cart, setCart] = useState({ items: [], subtotal: 0 });
// const [log, setLog] = useState([]);


// React.useEffect(()=>{
// socket.on('pos_event', ev => setLog(l => [JSON.stringify(ev), ...l]));
// return () => socket.off('pos_event');
// },[]);
// const scan = async () => {
// try {
// const { data } = await axios.post('/api/v1/pos/scan', { barcode });
// setCart(await (await axios.get('/api/v1/pos/cart-summary')).data).catch(()=>{});
// setLog(l => [`scanned: ${data.product.name}`, ...l]);
// } catch (err) { setLog(l => [`scan error: ${err.response?.data?.message||err.message}`, ...l]); }
// };


// const remove = async () => {
// try { const { data } = await axios.post('/api/v1/pos/remove', { barcode }); setLog(l=>[`removed`,...l]); } catch(e){ setLog(l=>[`remove error`,...l]); }
// };


// const checkout = async () => {
// try { const { data } = await axios.post('/api/v1/pos/checkout'); setLog(l=>[`checkout: ${JSON.stringify(data.summary)}`, ...l]); } catch(e){ setLog(l=>[`checkout error`,...l]); }
// };
// return (
// <div style={{ padding: 20 }}>
// <h2>POS Terminal (Simulated)</h2>
// <input value={barcode} onChange={e=>setBarcode(e.target.value)} placeholder="Enter / scan barcode" />
// <button onClick={scan}>Scan</button>
// <button onClick={remove}>Remove</button>
// <button onClick={checkout}>Checkout</button>


// <h3>Recent events</h3>
// <ul>{log.map((l,i)=> <li key={i}><pre>{l}</pre></li>)}</ul>
// </div>
// );
// }
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./POS.css";

export default function POS() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const merchantId = localStorage.getItem("merchantId");

  // Scan barcode
  const scanBarcode = async () => {
    if (!barcode.trim()) return;
    setLoading(true);

    try {
      const res = await axios.post("/api/v1/pos/scan", {
        barcode,
        merchantId
      });
      setCart(res.data.cart);
      setBarcode("");
    } catch (err) {
      alert("Product not found");
    } finally {
      setLoading(false);
    }
  };

  // Checkout
  const checkout = async () => {
    if (!cart || cart.items.length === 0) return;
    setLoading(true);

    try {
      const res = await axios.post("/api/v1/pos/checkout", {
        merchantId,
        paymentMethod
      });

      alert("Payment Successful\nOrder ID: " + res.data.order._id);
      setCart(null);
    } catch (err) {
      alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = cart?.items?.reduce(
    (sum, i) => sum + i.quantity * i.price,
    0
  );

  return (
    <div className="pos-container">
      <h2>POS Dashboard</h2>

      <div className="barcode-section">
        <input
          type="text"
          placeholder="Scan / Enter barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && scanBarcode()}
        />
        <button onClick={scanBarcode} disabled={loading}>
          Scan
        </button>
      </div>

      <div className="cart-section">
        <h3>Cart</h3>

        {!cart || cart.items.length === 0 ? (
          <p>No items scanned</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.productId?.name || "Item"}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price}</td>
                  <td>₹{item.quantity * item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {cart && cart.items.length > 0 && (
        <div className="checkout-section">
          <h3>Total: ₹{totalAmount}</h3>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="UPI">UPI</option>
          </select>

          <button onClick={checkout} disabled={loading}>
            Complete Payment
          </button>
        </div>
      )}
    </div>
  );
}
