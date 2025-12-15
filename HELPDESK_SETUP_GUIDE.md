# Complete Help Desk System Setup Guide

## ✅ What's Been Implemented

### Backend Components
- ✅ **Ticket Model** (`ticketModel.js`) - Full ticket schema with messages, attachments, resolution tracking
- ✅ **FAQ Model** (`faqModel.js`) - Knowledge base system for customer self-service
- ✅ **Ticket Controller** (`ticketController.js`) - User/Merchant ticket operations
- ✅ **Admin Controller** (`adminTicketController.js`) - Full admin dashboard functionality
- ✅ **Email Service** (`emailService.js`) - Automated email notifications for all ticket events
- ✅ **Telegram Notifications** (`ticketNotifications.js`) - Real-time Telegram alerts for admins
- ✅ **Help Desk Routes** (`helpDeskRoute.js`) - Complete API endpoints

### Frontend Components
- ✅ **HelpDesk Page** (`HelpDesk.jsx`) - User ticket creation and management
- ✅ **Admin Dashboard** (`AdminDashboard.jsx`) - Complete support management interface
- ✅ **Styling** - Professional CSS for both components

---

## 🚀 Installation Steps

### 1. Backend Setup

#### Install Required Packages
```bash
cd backend
npm install nodemailer axios
```

#### Environment Variables (.env)
```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourecommerce.com

# Frontend/Backend URLs
BACKEND_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:3000

# Telegram (already configured)
TELEGRAM_BOT_TOKEN=your_bot_token
```

**Note:** For Gmail, use an [App Password](https://myaccount.google.com/apppasswords), not your regular password.

#### Verify Routes Registration
Check that `app.js` includes:
```javascript
app.use('/api/v1/support', require('./routes/helpDeskRoute'));
```

### 2. Frontend Setup

#### Install Package (if not already)
```bash
cd frontend
npm install axios
```

#### Add Routes to your Router
Add these routes in your router configuration (likely `src/routes/index.js` or main routing file):

```javascript
import HelpDesk from '../pages/HelpDesk/HelpDesk';
import AdminDashboard from '../pages/AdminDashboard/AdminDashboard';

// In your route definitions:
{ path: '/helpdesk', element: <HelpDesk /> },
{ path: '/admin/dashboard', element: <AdminDashboard /> },  // Require admin role
{ path: '/helpdesk/:ticketId', element: <TicketDetail /> }  // Create this component
```

#### Create TicketDetail Component
You need to create a detailed ticket view component for individual ticket pages:

```javascript
// frontend/src/pages/HelpDesk/TicketDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const TicketDetail = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const { data } = await axios.get(`/api/v1/support/ticket/${ticketId}`);
      setTicket(data.ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessage = async () => {
    if (!message.trim()) return;
    try {
      await axios.post(`/api/v1/support/ticket/${ticketId}/message`, { message });
      setMessage('');
      fetchTicket();
    } catch (error) {
      console.error('Error adding message:', error);
      alert('Failed to add message');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div className="ticket-detail-page">
      <h2>{ticket.ticketId}: {ticket.subject}</h2>
      {/* Render ticket messages and reply form */}
    </div>
  );
};

export default TicketDetail;
```

---

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an App Password
4. Use this password in `.env` as `EMAIL_PASSWORD`

### Alternative Email Providers
**SendGrid:**
```javascript
// Update emailService.js
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

**AWS SES:**
```javascript
// Install: npm install aws-sdk
const AWS = require('aws-sdk');
const transporter = nodemailer.createTransport({
  SES: new AWS.SES({ region: 'us-east-1' })
});
```

---

## 🤖 Telegram Integration

### Automatic Notifications
The system sends Telegram notifications for:
- ✅ **New Ticket Created** - Admins get notified immediately
- ✅ **Customer Message** - Admins see new messages in real-time
- ✅ **Admin Reply** - Customers receive replies via Telegram
- ✅ **Ticket Resolved** - Both parties notified
- ✅ **Ticket Escalated** - Urgent alerts for escalations
- ✅ **Daily Summary** - Statistics sent each day

### Enable Telegram for Admins
Admins must connect their Telegram account via `/start` command in the bot:
1. Open Telegram chat with your bot
2. Click "Connect Telegram" from admin profile
3. Admin receives link from bot
4. Admin clicks link to connect account

---

## 🔌 API Endpoints

### User/Merchant Endpoints

#### Create Ticket
```bash
POST /api/v1/support/ticket/create
Content-Type: application/json

{
  "type": "ORDER_ISSUE",
  "subject": "Missing item in order",
  "description": "I ordered 3 items but received only 2",
  "category": "order",
  "priority": "HIGH"
}
```

#### Get My Tickets
```bash
GET /api/v1/support/my-tickets?status=OPEN&page=1&limit=10
```

#### Get Ticket Detail
```bash
GET /api/v1/support/ticket/{ticketId}
```

#### Add Message
```bash
POST /api/v1/support/ticket/{ticketId}/message
{
  "message": "I found the missing item"
}
```

#### Close Ticket & Rate
```bash
PUT /api/v1/support/ticket/{ticketId}/close
{
  "satisfactionScore": 5,
  "feedback": "Great support team!"
}
```

#### Get FAQ
```bash
GET /api/v1/support/faq?category=ORDER&userRole=USER
```

### Admin Endpoints

#### Get All Tickets
```bash
GET /api/v1/support/admin/tickets?status=OPEN&priority=HIGH&page=1
```

#### Assign Ticket
```bash
PUT /api/v1/support/admin/ticket/{ticketId}/assign
{
  "assignToId": "admin-user-id"
}
```

#### Add Admin Reply
```bash
POST /api/v1/support/admin/ticket/{ticketId}/reply
{
  "message": "We've found the issue and will ship it immediately",
  "isInternal": false
}
```

#### Resolve Ticket
```bash
PUT /api/v1/support/admin/ticket/{ticketId}/resolve
{
  "resolutionNote": "Shipped replacement item"
}
```

#### Get Analytics
```bash
GET /api/v1/support/admin/analytics?dateFrom=2025-01-01&dateTo=2025-01-31
```

#### Get Staff Metrics
```bash
GET /api/v1/support/admin/staff-metrics
```

---

## 📊 Dashboard Features

### User Help Desk
- Create support tickets
- View ticket status
- Message with support team
- Rate support experience
- Browse FAQ
- Filter tickets by status/priority

### Admin Dashboard
- **Overview Tab**: Stats, charts, top issues
- **Tickets Tab**: Manage all tickets, assign to staff, reply, resolve
- **Staff Tab**: View staff performance metrics
- Real-time updates
- Escalation system
- Internal notes (hidden from customers)

---

## 🔐 Security Considerations

1. **Authentication**: All endpoints require login
2. **Role-based Access**: Only admins can access admin routes
3. **Data Privacy**: Internal notes hidden from customers
4. **Email Validation**: Verify email credentials before sending
5. **Telegram Safety**: Only admins with connected accounts receive alerts

---

## 🧪 Testing the System

### 1. Test Ticket Creation
```bash
# Login as user, go to /helpdesk
# Click "Create New Ticket"
# Fill form and submit
# Check backend logs for email sent confirmation
```

### 2. Test Email Notifications
```bash
# Check your email for notification
# Should receive: Ticket Created confirmation
# When admin replies: Ticket Updated notification
```

### 3. Test Telegram Notifications
```bash
# Login as admin
# Go to profile, click "Connect Telegram"
# Open bot chat and click the link
# Create a ticket as user
# You should receive Telegram notification immediately
```

### 4. Test Admin Dashboard
```bash
# Login as admin
# Go to /admin/dashboard
# View all tickets
# Click a ticket to see details
# Try assigning, replying, resolving
```

---

## 🐛 Troubleshooting

### Emails not sending
- ✅ Check `.env` variables
- ✅ Verify Gmail App Password (not regular password)
- ✅ Check email logs in backend console
- ✅ Enable "Less secure apps" if using regular Gmail password

### Telegram notifications not working
- ✅ Verify `TELEGRAM_BOT_TOKEN` in `.env`
- ✅ Check bot is polling (see server logs)
- ✅ Admin must connect Telegram from profile
- ✅ Check admin has `telegramChatId` in database

### Tickets not appearing
- ✅ Verify user is logged in
- ✅ Check user ID is correct in database
- ✅ Verify ticketModel is registered

### Admin can't see all tickets
- ✅ Verify user has `role: 'admin'`
- ✅ Check authorization middleware in routes

---

## 📈 Next Steps

### Optional Enhancements
1. **Live Chat**: Add Socket.io for real-time messaging
2. **Knowledge Base**: Expand FAQ with categories
3. **Email Templates**: Enhance email designs
4. **Mobile App**: Create native mobile support app
5. **Survey**: Post-resolution satisfaction surveys
6. **Analytics**: Advanced reporting and insights
7. **Auto-reply**: Automatic responses based on keywords
8. **Chatbot**: AI-powered support chatbot
9. **Multi-language**: Support multiple languages
10. **Mobile Notifications**: Push notifications on mobile

---

## 📞 Support Ticket Lifecycle

```
USER CREATES TICKET
        ↓
SYSTEM SENDS EMAIL CONFIRMATION
        ↓
ADMIN RECEIVES TELEGRAM ALERT
        ↓
ADMIN ASSIGNS TICKET
        ↓
CUSTOMER + ADMIN COMMUNICATE
        ↓
ADMIN RESOLVES TICKET
        ↓
CUSTOMER RECEIVES RESOLUTION EMAIL
        ↓
CUSTOMER RATES EXPERIENCE
        ↓
TICKET CLOSED
```

---

## 💾 Database Schema Summary

### Ticket Document
```javascript
{
  _id: ObjectId,
  ticketId: "TKT-timestamp-count",
  userId/merchantId: ObjectId,
  type: "USER_QUERY|ORDER_ISSUE|...",
  priority: "LOW|MEDIUM|HIGH|URGENT",
  status: "OPEN|IN_PROGRESS|RESOLVED|CLOSED",
  subject: String,
  description: String,
  messages: [{ sender, senderRole, message, timestamp, isInternal }],
  assignedTo: ObjectId (admin),
  resolution: { resolutionNote, satisfactionScore },
  createdAt, updatedAt, resolvedAt, closedAt
}
```

### FAQ Document
```javascript
{
  _id: ObjectId,
  question: String,
  answer: String,
  category: "USER|MERCHANT|GENERAL|...",
  userRole: "USER|MERCHANT|ALL",
  views: Number,
  helpfulCount: Number,
  unhelpfulCount: Number,
  isActive: Boolean,
  createdAt, updatedAt
}
```

---

**Setup Complete! 🎉 Your Help Desk system is now ready to use.**

For issues or questions, check the troubleshooting section or review the backend logs for detailed error messages.
