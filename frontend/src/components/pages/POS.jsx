// frontend/src/pages/POS.jsx
import React, { useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';


const socket = io(/* server origin default */);


export default function POSPage(){
const [barcode, setBarcode] = useState('');
const [cart, setCart] = useState({ items: [], subtotal: 0 });
const [log, setLog] = useState([]);


React.useEffect(()=>{
socket.on('pos_event', ev => setLog(l => [JSON.stringify(ev), ...l]));
return () => socket.off('pos_event');
},[]);
const scan = async () => {
try {
const { data } = await axios.post('/api/v1/pos/scan', { barcode });
setCart(await (await axios.get('/api/v1/pos/cart-summary')).data).catch(()=>{});
setLog(l => [`scanned: ${data.product.name}`, ...l]);
} catch (err) { setLog(l => [`scan error: ${err.response?.data?.message||err.message}`, ...l]); }
};


const remove = async () => {
try { const { data } = await axios.post('/api/v1/pos/remove', { barcode }); setLog(l=>[`removed`,...l]); } catch(e){ setLog(l=>[`remove error`,...l]); }
};


const checkout = async () => {
try { const { data } = await axios.post('/api/v1/pos/checkout'); setLog(l=>[`checkout: ${JSON.stringify(data.summary)}`, ...l]); } catch(e){ setLog(l=>[`checkout error`,...l]); }
};
return (
<div style={{ padding: 20 }}>
<h2>POS Terminal (Simulated)</h2>
<input value={barcode} onChange={e=>setBarcode(e.target.value)} placeholder="Enter / scan barcode" />
<button onClick={scan}>Scan</button>
<button onClick={remove}>Remove</button>
<button onClick={checkout}>Checkout</button>


<h3>Recent events</h3>
<ul>{log.map((l,i)=> <li key={i}><pre>{l}</pre></li>)}</ul>
</div>
);
}