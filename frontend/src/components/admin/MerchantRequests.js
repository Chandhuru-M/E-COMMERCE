import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Sidebar from './Sidebar';
import Loader from '../layouts/Loader';

export default function MerchantRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get('/api/v1/merchant/requests');
      setRequests(data);
    } catch (error) {
      toast.error('Failed to load merchant requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      const { data } = await axios.post(`/api/v1/merchant/approve/${id}`);
      
      if (data.success) {
        toast.success(`Merchant approved! Temporary password: ${data.password}`);
        alert(`Merchant Credentials:\nEmail: ${data.email || 'See request'}\nPassword: ${data.password}\n\nPlease share these credentials with the merchant.`);
        fetchRequests(); // Refresh list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve merchant');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;

    try {
      await axios.post(`/api/v1/merchant/reject/${id}`);
      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="row m-0">
      <div className="col-12 col-md-auto p-0">
        <Sidebar />
      </div>
      <div className="col-12 col-md">
        <h1 className="my-4">Merchant Requests</h1>

        {requests.length === 0 ? (
          <p className="text-center">No pending merchant requests</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped admin-table">
              <thead>
                <tr>
                  <th>Owner Name</th>
                  <th>Store Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>License</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.ownerName}</td>
                    <td>{request.storeName}</td>
                    <td>{request.email}</td>
                    <td>{request.phone}</td>
                    <td>{request.licenseNumber}</td>
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-success btn-sm mr-2"
                        onClick={() => handleApprove(request._id)}
                        disabled={approving === request._id}
                      >
                        {approving === request._id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(request._id)}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
