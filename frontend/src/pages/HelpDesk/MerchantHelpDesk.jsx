import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HelpDesk.css';
import MerchantSidebar from '../../components/merchant/MerchantSidebar';

const MerchantHelpDesk = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    type: 'MERCHANT_STORE_ISSUE',
    subject: '',
    description: '',
    category: 'payment',
    priority: 'MEDIUM',
    attachments: []
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  // Fetch tickets
  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    } else {
      fetchFAQs();
    }
  }, [activeTab, filterStatus]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const query = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const { data } = await axios.get(`/api/v1/support/my-tickets${query}`);
      // Filter for merchant tickets only
      const merchantTickets = data.tickets?.filter(t => t.type?.includes('MERCHANT')) || [];
      setTickets(merchantTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/v1/support/faq?userRole=MERCHANT');
      setFaqs(data.faqs || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post('/api/v1/support/ticket/create', formData);
      
      if (data.success) {
        alert('Ticket created successfully! Ticket ID: ' + data.ticket.ticketId);
        setFormData({
          type: 'MERCHANT_STORE_ISSUE',
          subject: '',
          description: '',
          category: 'payment',
          priority: 'MEDIUM',
          attachments: []
        });
        setShowCreateForm(false);
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMessage = async (ticketId) => {
    const message = window.prompt('Enter your message:');
    if (!message) return;

    try {
      const { data } = await axios.post(
        `/api/v1/support/ticket/${ticketId}/message`,
        { message }
      );
      if (data.success) {
        alert('Message added successfully');
        fetchTickets();
        setSelectedTicket(null);
      }
    } catch (error) {
      alert('Error adding message');
    }
  };

  const handleCloseTicket = async (ticketId) => {
    const rating = window.prompt('Rate your support experience (1-5):');
    if (!rating) return;

    try {
      const { data } = await axios.put(
        `/api/v1/support/ticket/${ticketId}/close`,
        { satisfactionScore: parseInt(rating) }
      );
      if (data.success) {
        alert('Ticket closed successfully');
        fetchTickets();
        setSelectedTicket(null);
      }
    } catch (error) {
      alert('Error closing ticket');
    }
  };

  const handleMarkFAQHelpful = async (faqId, helpful) => {
    try {
      const { data } = await axios.post(
        `/api/v1/support/faq/${faqId}/helpful`,
        { helpful }
      );
      if (data.success) {
        fetchFAQs();
      }
    } catch (error) {
      console.error('Error marking FAQ:', error);
    }
  };

  const filteredTickets = tickets.filter(t =>
    t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ticketId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="row m-0">
      <div className="col-12 col-md-auto p-0">
          <MerchantSidebar/>
      </div>
      
      <div className="col-12 col-md">
        <div className="helpdesk-container">
          <div className="helpdesk-header">
            <h1>🏪 Merchant Support Center</h1>
            <p>Get help with your store, payments, inventory, and more</p>
          </div>

          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => setActiveTab('tickets')}
            >
              📋 My Support Tickets
            </button>
            <button
              className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              ❓ Merchant FAQ
            </button>
          </div>

          {activeTab === 'tickets' && (
            <div className="tickets-view">
              <div className="tickets-header">
                <h2>Support Tickets</h2>
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                >
                  {showCreateForm ? '✕ Close' : '+ New Ticket'}
                </button>
              </div>

              {showCreateForm && (
                <div className="create-ticket-form">
                  <h3>Create New Support Ticket</h3>
                  <form onSubmit={handleCreateTicket}>
                    <div className="form-group">
                  <label>Issue Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="MERCHANT_STORE_ISSUE">Store Issue</option>
                    <option value="MERCHANT_PAYMENT_ISSUE">Payment Issue</option>
                    <option value="MERCHANT_INVENTORY_ISSUE">Inventory Issue</option>
                    <option value="MERCHANT_SETTLEMENT_ISSUE">Settlement Issue</option>
                    <option value="MERCHANT_TECHNICAL_ISSUE">Technical Issue</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="payment">Payment & Settlement</option>
                    <option value="shipping">Shipping & Delivery</option>
                    <option value="inventory">Inventory Management</option>
                    <option value="account">Account & KYC</option>
                    <option value="returns">Returns & Refunds</option>
                    <option value="orders">Order Management</option>
                    <option value="technical">Technical Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed description of your issue"
                    rows="4"
                    required
                  />
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </form>
            </div>
          )}

          <div className="tickets-filters">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {loading ? (
            <p className="loading">Loading tickets...</p>
          ) : filteredTickets.length > 0 ? (
            <div className="tickets-list">
              {filteredTickets.map(ticket => (
                <div
                  key={ticket._id}
                  className={`ticket-card ${selectedTicket?._id === ticket._id ? 'active' : ''}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="ticket-card-header">
                    <h4>{ticket.ticketId}</h4>
                    <span className={`priority-badge priority-${ticket.priority?.toLowerCase()}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h5>{ticket.subject}</h5>
                  <p className="ticket-type">📌 {ticket.type}</p>
                  <div className="ticket-footer">
                    <span className={`status-badge status-${ticket.status?.toLowerCase()}`}>
                      {ticket.status}
                    </span>
                    <span className="ticket-date">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No support tickets found</p>
              <button
                className="btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                Create your first ticket
              </button>
            </div>
          )}

          {selectedTicket && (
            <div className="ticket-detail">
              <div className="detail-header">
                <h3>Ticket Details</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelectedTicket(null)}
                >
                  ✕
                </button>
              </div>

              <div className="detail-content">
                <div className="detail-section">
                  <h4>Ticket Information</h4>
                  <div className="detail-row">
                    <span className="label">ID:</span>
                    <span className="value">{selectedTicket.ticketId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className={`status-badge status-${selectedTicket.status?.toLowerCase()}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Priority:</span>
                    <span className={`priority-badge priority-${selectedTicket.priority?.toLowerCase()}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Type:</span>
                    <span className="value">{selectedTicket.type}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Subject</h4>
                  <p>{selectedTicket.subject}</p>
                </div>

                <div className="detail-section">
                  <h4>Description</h4>
                  <p>{selectedTicket.description}</p>
                </div>

                {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                  <div className="detail-section">
                    <h4>Conversation</h4>
                    <div className="messages-list">
                      {selectedTicket.messages.map((msg, idx) => (
                        <div key={idx} className="message">
                          <div className="message-header">
                            <strong>{msg.senderName}</strong>
                            <small>{new Date(msg.createdAt).toLocaleString()}</small>
                          </div>
                          <p>{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-actions">
                  {selectedTicket.status !== 'CLOSED' && (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={() => handleAddMessage(selectedTicket._id)}
                      >
                        💬 Add Message
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleCloseTicket(selectedTicket._id)}
                      >
                        ✓ Close Ticket
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="faq-view">
          <h2>Merchant Support FAQ</h2>
          <p className="faq-subtitle">Find answers to common merchant questions</p>

          {loading ? (
            <p className="loading">Loading FAQs...</p>
          ) : faqs.length > 0 ? (
            <div className="faq-list">
              {faqs.map(faq => (
                <div key={faq._id} className="faq-item">
                  <div className="faq-question">
                    <h4>{faq.question}</h4>
                    <span className="faq-category">{faq.category}</span>
                  </div>
                  <p className="faq-answer">{faq.answer}</p>
                  <div className="faq-footer">
                    <button
                      className="faq-helpful"
                      onClick={() => handleMarkFAQHelpful(faq._id, true)}
                    >
                      👍 Helpful ({faq.helpfulCount || 0})
                    </button>
                    <button
                      className="faq-helpful"
                      onClick={() => handleMarkFAQHelpful(faq._id, false)}
                    >
                      👎 Not Helpful ({faq.unhelpfulCount || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No FAQs available at the moment</p>
              <p>Create a support ticket if you need help</p>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
    </div>
  );
};

export default MerchantHelpDesk;
