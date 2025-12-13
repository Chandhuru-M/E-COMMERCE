import { useEffect, useState } from "react";
import axios from "axios";

export default function POSAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get("/api/v1/pos/analytics")
      .then(res => setData(res.data));
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h2>POS Analytics</h2>
      <p>Total Orders: {data.totalOrders}</p>
      <p>Total Sales: ₹{data.totalSales}</p>

      <h4>Payment Split</h4>
      <p>Cash: {data.paymentSplit.cash}</p>
      <p>Card: {data.paymentSplit.card}</p>
      <p>UPI: {data.paymentSplit.upi}</p>
    </div>
  );
}
