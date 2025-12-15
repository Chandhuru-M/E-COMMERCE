import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HelpDesk.css';

const HelpDesk = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    type: 'USER_QUERY',
    subject: '',
    description: '',
    category: 'other',
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
      // Filter for user tickets only (not merchant)
      const userTickets = data.tickets?.filter(t => !t.type?.includes('MERCHANT')) || [];
      setTickets(userTickets);
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
      const { data } = await axios.get('/api/v1/support/faq');
      setFaqs(data.faqs);
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
          type: 'USER_QUERY',
          subject: '',
          description: '',
          category: 'other',
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

  const handleFAQHelpful = async (faqId, helpful) => {
    try {
      await axios.post(`/api/v1/support/faq/${faqId}/helpful`, { helpful });
    } catch (error) {
      console.error('Error marking FAQ:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'OPEN': 'badge-warning',
      'IN_PROGRESS': 'badge-info',
      'RESOLVED': 'badge-success',
      'CLOSED': 'badge-secondary',
      'WAITING_CUSTOMER': 'badge-warning'
    };
    return statusStyles[status] || 'badge-secondary';
  };

  const getPriorityBadge = (priority) => {
    const priorityStyles = {
      'LOW': 'priority-low',
      'MEDIUM': 'priority-medium',
      'HIGH': 'priority-high',
      'URGENT': 'priority-urgent'
    };
    return priorityStyles[priority] || 'priority-medium';
  };

  return (
    <div className="helpdesk-container">
      <div className="helpdesk-header">
        <h1>Support Center</h1>
        <p>Get help with your orders and account</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          🎫 My Tickets
        </button>
        <button 
          className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          ❓ FAQ
        </button>
      </div>

      {activeTab === 'tickets' && (
        <div className="tickets-section">
          <div className="tickets-header">
            <h2>Support Tickets</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              ➕ Create New Ticket
            </button>
          </div>

          {showCreateForm && (
            <form className="ticket-form" onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label>Issue Type *</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="USER_QUERY">User Query</option>
                  <option value="ORDER_ISSUE">Order Issue</option>
                  <option value="PAYMENT_ISSUE">Payment Issue</option>
                  <option value="PRODUCT_COMPLAINT">Product Complaint</option>
                  <option value="RETURN_REFUND">Return/Refund</option>
                  <option value="TECHNICAL">Technical Issue</option>
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
                  <option value="other">Other</option>
                  <option value="product">Product</option>
                  <option value="order">Order</option>
                  <option value="payment">Payment</option>
                  <option value="delivery">Delivery</option>
                  <option value="return">Return</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select 
                  name="priority" 
                  value={formData.priority} 
                  onChange={handleInputChange}
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
                  placeholder="Provide detailed information about your issue"
                  rows="6"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="filter-section">
            <div className="filter-buttons">
              {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => (
                <button 
                  key={status}
                  className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <p>No tickets found</p>
              <p className="empty-subtitle">Create a new ticket to get support</p>
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.map(ticket => (
                <div 
                  key={ticket._id} 
                  className="ticket-card"
                  onClick={() => navigate(`/helpdesk/${ticket._id}`)}
                >
                  <div className="ticket-header">
                    <div className="ticket-id-section">
                      <span className="ticket-id">{ticket.ticketId}</span>
                      <h3>{ticket.subject}</h3>
                    </div>
                    <div className="ticket-badges">
                      <span className={`badge status-badge ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`badge ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>

                  <div className="ticket-body">
                    <p className="ticket-category">Category: {ticket.category}</p>
                    <p className="ticket-description">
                      {ticket.description.substring(0, 100)}...
                    </p>
                  </div>

                  <div className="ticket-footer">
                    <span className="ticket-date">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    <span className="ticket-messages">
                      💬 {ticket.messages?.length || 0} messages
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          
          {loading ? (
            <div className="loading">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="empty-state">
              <p>No FAQs found</p>
            </div>
          ) : (
            <div className="faq-list">
              {faqs.map(faq => (
                <div key={faq._id} className="faq-item">
                  <div className="faq-question">
                    <h4>{faq.question}</h4>
                    <span className="faq-category">{faq.category}</span>
                  </div>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                  <div className="faq-footer">
                    <button 
                      className="helpful-btn"
                      onClick={() => handleFAQHelpful(faq._id, true)}
                    >
                      👍 Helpful ({faq.helpfulCount})
                    </button>
                    <button 
                      className="unhelpful-btn"
                      onClick={() => handleFAQHelpful(faq._id, false)}
                    >
                      👎 Not Helpful ({faq.unhelpfulCount})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HelpDesk;
