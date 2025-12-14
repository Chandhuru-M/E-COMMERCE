import axios from "axios";
import { useEffect, useState } from "react";

export default function MerchantApproval() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axios.get("/api/v1/merchant/requests")
      .then(res => setRequests(res.data));
  }, []);

  const approve = async id => {
    const res = await axios.post(`/api/v1/merchant/approve/${id}`);
    alert("Merchant approved. Password: " + res.data.password);
    setRequests(requests.filter(r => r._id !== id));
  };

  return (
    <div>
      <h2>Merchant Requests</h2>
      {requests.map(r => (
        <div key={r._id}>
          <b>{r.storeName}</b> ({r.email})
          <button onClick={() => approve(r._id)}>Approve</button>
        </div>
      ))}
    </div>
  );
}
