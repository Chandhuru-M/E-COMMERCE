import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HelpDesk.css';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/support/ticket/${id}`);
      if (data && data.success) {
        setTicket(data.ticket);
      } else {
        setTicket(null);
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      setSending(true);
      const payload = { message };
      const { data } = await axios.post(`/api/v1/support/ticket/${id}/message`, payload);
      if (data && data.success) {
        setMessage('');
        // refresh
        await fetchTicket();
      } else {
        alert('Failed to send message');
      }
    } catch (err) {
      console.error('Send message error:', err);
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="helpdesk-container"><p>Loading ticket...</p></div>;

  if (!ticket) return (
    <div className="helpdesk-container">
      <div className="helpdesk-header">
        <h2>Ticket not found</h2>
        <p>The ticket may not exist or you may not have access.</p>
        <button className="btn" onClick={() => navigate('/support')}>Back to Support</button>
      </div>
    </div>
  );

  return (
    <div className="helpdesk-container">
      <div className="helpdesk-header">
        <h1>Ticket Detail</h1>
        <p>Ticket ID: {ticket.ticketId}</p>
      </div>

      <div className="ticket-detail-card">
        <h3>{ticket.subject}</h3>
        <div className="ticket-meta">
          <span className={`badge status-badge`}>{ticket.status}</span>
          <span className={`badge`}>{ticket.priority}</span>
          <span style={{ marginLeft: '8px', color: '#666' }}>Category: {ticket.category}</span>
        </div>

        <div className="ticket-description" style={{ marginTop: '12px' }}>
          <p>{ticket.description}</p>
        </div>

        <div className="ticket-messages" style={{ marginTop: '18px' }}>
          <h4>Conversation</h4>
          {ticket.messages && ticket.messages.length > 0 ? (
            ticket.messages.map((m, idx) => (
              <div key={idx} className={`message ${m.senderRole === 'User' ? 'user' : 'admin'}`} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                <div style={{ fontWeight: '600' }}>{m.senderName || m.senderRole}</div>
                <div style={{ color: '#333', whiteSpace: 'pre-line' }}>{m.message}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{new Date(m.timestamp).toLocaleString()}</div>
              </div>
            ))
          ) : (
            <p>No messages yet.</p>
          )}
        </div>

        <form onSubmit={handleSendMessage} style={{ marginTop: '16px' }}>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your reply..." rows={4} style={{ width: '100%', padding: '8px' }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="btn btn-primary" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send Message'}</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/support')}>Back</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketDetail;
