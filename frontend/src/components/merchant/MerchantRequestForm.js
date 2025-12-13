import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import MetaData from '../layouts/MetaData';

export default function MerchantRequestForm() {
  const [formData, setFormData] = useState({
    ownerName: '',
    storeName: '',
    email: '',
    phone: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const { data } = await axios.post('/api/v1/merchant/request', formData, config);

      if (data.success) {
        toast.success('Merchant request submitted successfully! Admin will review and contact you.');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container container-fluid">
      <MetaData title={'Become a Merchant'} />
      <div className="row wrapper">
        <div className="col-10 col-lg-6 mx-auto">
          <form className="shadow-lg" onSubmit={handleSubmit}>
            <h1 className="mb-4 text-center">Become a Merchant</h1>

            <div className="form-group">
              <label htmlFor="owner_name">Owner Name</label>
              <input
                type="text"
                id="owner_name"
                name="ownerName"
                className="form-control"
                value={formData.ownerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="store_name">Store Name</label>
              <input
                type="text"
                id="store_name"
                name="storeName"
                className="form-control"
                value={formData.storeName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="license_number">Business License Number</label>
              <input
                type="text"
                id="license_number"
                name="licenseNumber"
                className="form-control"
                value={formData.licenseNumber}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-block py-3"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
