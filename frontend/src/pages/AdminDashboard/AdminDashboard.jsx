import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [analytics, setAnalytics] = useState({
    stats: { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, avgSatisfaction: null },
    byPriority: [],
    byCategory: [],
    resolutionTimes: { avgTime: null, maxTime: null, minTime: null },
    topIssues: []
  });
  const [staffMetrics, setStaffMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [adminReply, setAdminReply] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [filterStatus, filterPriority]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [ticketsRes, analyticsRes, staffRes] = await Promise.all([
        axios.get('/api/v1/support/admin/tickets', {
          params: {
            status: filterStatus !== 'all' ? filterStatus : undefined,
            priority: filterPriority !== 'all' ? filterPriority : undefined,
            limit: 100
          }
        }),
        axios.get('/api/v1/support/admin/analytics'),
        axios.get('/api/v1/support/admin/staff-metrics')
      ]);

      // Set tickets data
      setTickets(ticketsRes.data.tickets || []);
      
      // Set analytics with default values
      const analyticsData = analyticsRes.data.analytics || {};
      setAnalytics({
        stats: analyticsData.stats || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, avgSatisfaction: null },
        byPriority: analyticsData.byPriority || [],
        byCategory: analyticsData.byCategory || [],
        resolutionTimes: analyticsData.resolutionTimes || { avgTime: null, maxTime: null, minTime: null },
        topIssues: analyticsData.topIssues || []
      });
      
      // Set staff metrics
      setStaffMetrics(staffRes.data.staffMetrics || []);
      
      console.log('Dashboard data loaded:', {
        ticketsCount: ticketsRes.data.tickets?.length,
        analytics: analyticsData,
        staffCount: staffRes.data.staffMetrics?.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error.response?.data || error.message);
      // Set default values on error
      setAnalytics({
        stats: { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, avgSatisfaction: null },
        byPriority: [],
        byCategory: [],
        resolutionTimes: { avgTime: null, maxTime: null, minTime: null },
        topIssues: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTicket = async (ticketId, staffId) => {
    try {
      const { data } = await axios.put(
        `/api/v1/support/admin/ticket/${ticketId}/assign`,
        { assignToId: staffId }
      );
      if (data.success) {
        alert('Ticket assigned successfully');
        fetchDashboardData();
      }
    } catch (error) {
      alert('Error assigning ticket');
    }
  };

  const handleAddReply = async (ticketId) => {
    if (!adminReply.trim()) return;

    try {
      const { data } = await axios.post(
        `/api/v1/support/admin/ticket/${ticketId}/reply`,
        { message: adminReply }
      );
      if (data.success) {
        setAdminReply('');
        setSelectedTicket(null);
        fetchDashboardData();
        alert('Reply sent successfully');
      }
    } catch (error) {
      alert('Error sending reply');
    }
  };

  const handleResolveTicket = async (ticketId) => {
    if (!resolutionNote.trim()) {
      alert('Please enter a resolution note');
      return;
    }

    try {
      const { data } = await axios.put(
        `/api/v1/support/admin/ticket/${ticketId}/resolve`,
        { resolutionNote }
      );
      if (data.success) {
        setResolutionNote('');
        setSelectedTicket(null);
        fetchDashboardData();
        alert('Ticket resolved successfully');
      }
    } catch (error) {
      alert('Error resolving ticket');
    }
  };

  const handleEscalateTicket = async (ticketId) => {
    try {
      const reason = window.prompt('Enter escalation reason:');
      if (!reason) return;

      const { data } = await axios.put(
        `/api/v1/support/admin/ticket/${ticketId}/escalate`,
        { reason }
      );
      if (data.success) {
        fetchDashboardData();
        alert('Ticket escalated successfully');
      }
    } catch (error) {
      alert('Error escalating ticket');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Support Management Dashboard</h1>
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid white',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      <div className="view-tabs">
        <button 
          className={`view-tab ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`view-tab ${activeView === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveView('tickets')}
        >
          🎫 Tickets
        </button>
        <button 
          className={`view-tab ${activeView === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveView('staff')}
        >
          👥 Staff Metrics
        </button>
      </div>

      {activeView === 'overview' && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <p className="stat-label">Total Tickets</p>
                <p className="stat-value">{analytics.stats?.total || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📖</div>
              <div className="stat-content">
                <p className="stat-label">Open</p>
                <p className="stat-value">{analytics.stats?.open || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <p className="stat-label">In Progress</p>
                <p className="stat-value">{analytics.stats?.inProgress || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <p className="stat-label">Resolved</p>
                <p className="stat-value">{analytics.stats?.resolved || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <p className="stat-label">Avg Satisfaction</p>
                <p className="stat-value">
                  {analytics.stats?.avgSatisfaction 
                    ? analytics.stats.avgSatisfaction.toFixed(1) 
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <p className="stat-label">Avg Resolution Time</p>
                <p className="stat-value">
                  {analytics.resolutionTimes?.avgTime 
                    ? `${(analytics.resolutionTimes.avgTime / (1000 * 60 * 60)).toFixed(1)}h` 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-container">
              <h3>Tickets by Priority</h3>
              <div className="chart-bars">
                {analytics.byPriority?.map(item => (
                  <div key={item._id} className="bar-item">
                    <div className="bar-label">{item._id}</div>
                    <div className="bar">
                      <div 
                        className="bar-fill"
                        style={{ width: `${(item.count / (analytics.stats?.total || 1)) * 100}%` }}
                      >
                        {item.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-container">
              <h3>Top Issues</h3>
              <div className="issue-list">
                {analytics.topIssues?.map(issue => (
                  <div key={issue._id} className="issue-item">
                    <span className="issue-type">{issue._id}</span>
                    <span className="issue-count">{issue.count} tickets</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'tickets' && (
        <div className="tickets-section">
          <div className="filter-bar">
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

            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="tickets-container">
            <div className="tickets-list-pane">
              {loading ? (
                <div className="loading">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="empty">No tickets found</div>
              ) : (
                tickets.map(ticket => (
                  <div 
                    key={ticket._id}
                    className={`ticket-item ${selectedTicket?._id === ticket._id ? 'active' : ''}`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="ticket-item-header">
                      <span className="ticket-item-id">{ticket.ticketId}</span>
                      <span className={`priority-badge priority-${ticket.priority.toLowerCase()}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="ticket-item-subject">{ticket.subject}</p>
                    <p className="ticket-item-customer">
                      From: {ticket.userId?.name || ticket.merchantId?.shopName}
                    </p>
                    <div className="ticket-item-status">
                      <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedTicket && (
              <div className="ticket-detail-pane">
                <div className="detail-header">
                  <h3>{selectedTicket.ticketId}</h3>
                  <button className="close-btn" onClick={() => setSelectedTicket(null)}>✕</button>
                </div>

                <div className="detail-content">
                  <h4>{selectedTicket.subject}</h4>
                  <p className="detail-description">{selectedTicket.description}</p>

                  <div className="detail-meta">
                    <div className="meta-item">
                      <span className="meta-label">Customer:</span>
                      <span>{selectedTicket.userId?.name || selectedTicket.merchantId?.shopName}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Category:</span>
                      <span>{selectedTicket.category}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Status:</span>
                      <span className={`status-badge status-${selectedTicket.status.toLowerCase()}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>

                  <div className="messages-section">
                    <h5>Messages</h5>
                    <div className="messages-list">
                      {selectedTicket.messages?.map((msg, idx) => (
                        <div key={idx} className={`message message-${msg.senderRole.toLowerCase()}`}>
                          <p className="message-sender">
                            <strong>{msg.senderName}</strong> ({msg.senderRole})
                            {msg.isInternal && <span className="internal-badge">Internal</span>}
                          </p>
                          <p className="message-text">{msg.message}</p>
                          <p className="message-time">
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedTicket.status !== 'CLOSED' && (
                    <div className="actions-section">
                      <div className="reply-box">
                        <textarea 
                          placeholder="Type your reply..."
                          value={adminReply}
                          onChange={(e) => setAdminReply(e.target.value)}
                          rows="4"
                        />
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleAddReply(selectedTicket._id)}
                        >
                          Send Reply
                        </button>
                      </div>

                      <div className="action-buttons">
                        <button 
                          className="btn btn-success"
                          onClick={() => {
                            const note = window.prompt('Enter resolution note:');
                            if (note) {
                              setResolutionNote(note);
                              handleResolveTicket(selectedTicket._id);
                            }
                          }}
                        >
                          ✅ Resolve Ticket
                        </button>
                        <button 
                          className="btn btn-warning"
                          onClick={() => handleEscalateTicket(selectedTicket._id)}
                        >
                          ⚠️ Escalate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'staff' && (
        <div className="staff-section">
          <h3>Staff Performance Metrics</h3>
          <div className="staff-grid">
            {staffMetrics.map(staff => (
              <div key={staff._id} className="staff-card">
                <h4>{staff._id?.name || 'Unknown'}</h4>
                <p className="staff-email">{staff._id?.email}</p>
                <div className="staff-stats">
                  <div className="stat">
                    <span className="label">Total Tickets:</span>
                    <span className="value">{staff.totalTickets}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Resolved:</span>
                    <span className="value">{staff.resolved}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Avg Satisfaction:</span>
                    <span className="value">
                      {staff.avgSatisfaction ? staff.avgSatisfaction.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
