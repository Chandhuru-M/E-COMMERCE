import React, { useState } from "react";
import axios from "axios";

export default function MerchantRequest() {
  const [form, setForm] = useState({
    ownerName: "",
    storeName: "",
    email: "",
    phone: "",
    licenseNumber: ""
  });

  const submitRequest = async () => {
    try {
      await axios.post("/api/v1/merchant/request", form);
      alert("Request submitted. Our team will contact you.");
      setForm({});
    } catch (e) {
      alert("Submission failed");
    }
  };

  return (
    <div className="container">
      <h2>Become a Merchant</h2>

      {Object.keys(form).map(key => (
        <input
          key={key}
          placeholder={key}
          value={form[key] || ""}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
        />
      ))}

      <button onClick={submitRequest}>Submit</button>
    </div>
  );
}
