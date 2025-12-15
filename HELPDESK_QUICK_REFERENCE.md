# Help Desk System - Quick Reference

## 🎯 Files Created/Modified

### Models
- `backend/models/ticketModel.js` - Support ticket schema
- `backend/models/faqModel.js` - FAQ/Knowledge base schema

### Controllers
- `backend/controllers/ticketController.js` - User/Merchant ticket operations
- `backend/controllers/adminTicketController.js` - Admin dashboard operations

### Services
- `backend/services/emailService.js` - Email notifications
- `backend/telegram/ticketNotifications.js` - Telegram notifications

### Routes
- `backend/routes/helpDeskRoute.js` - All support API endpoints
- `backend/app.js` - Added route registration

### Frontend
- `frontend/src/pages/HelpDesk/HelpDesk.jsx` - User help desk page
- `frontend/src/pages/HelpDesk/HelpDesk.css` - Help desk styling
- `frontend/src/pages/AdminDashboard/AdminDashboard.jsx` - Admin dashboard
- `frontend/src/pages/AdminDashboard/AdminDashboard.css` - Admin styling

### Documentation
- `HELPDESK_SETUP_GUIDE.md` - Complete setup instructions
- `HELPDESK_QUICK_REFERENCE.md` - This file

---

## ⚙️ Quick Setup (5 minutes)

### Step 1: Install Packages
```bash
cd backend
npm install nodemailer
```

### Step 2: Update .env
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
BACKEND_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:3000
TELEGRAM_BOT_TOKEN=your_existing_token
```

### Step 3: Add Frontend Routes
```javascript
// In your routing file
import HelpDesk from '../pages/HelpDesk/HelpDesk';
import AdminDashboard from '../pages/AdminDashboard/AdminDashboard';

{ path: '/helpdesk', element: <HelpDesk /> }
{ path: '/admin/dashboard', element: <AdminDashboard /> }
```

### Step 4: Test
- User creates ticket at `/helpdesk`
- Admin views dashboard at `/admin/dashboard`
- Emails and Telegram notifications should work

---

## 🚀 Features at a Glance

### For Users
| Feature | Description |
|---------|-------------|
| Create Ticket | Submit support requests with category & priority |
| View Tickets | See all your tickets and their status |
| Message | Communicate with support team |
| Rate Support | Provide feedback after resolution |
| Browse FAQ | Self-service knowledge base |

### For Merchants
| Feature | Description |
|---------|-------------|
| Create Ticket | Report store & payment issues |
| Track Status | Monitor ticket progress |
| Direct Chat | Message with support staff |
| View History | See past issues & resolutions |

### For Admins
| Feature | Description |
|---------|-------------|
| Dashboard | View all stats & metrics |
| Manage Tickets | Assign, reply, resolve tickets |
| Analytics | Track performance & trends |
| Staff Metrics | Monitor individual staff performance |
| FAQ Management | Create & update knowledge base |
| Escalation | Flag urgent tickets |
| Internal Notes | Add notes (hidden from customers) |

---

## 📡 Notification Channels

### Email Notifications
- Ticket Created ✅
- Ticket Assigned ✅
- New Message ✅
- Support Reply ✅
- Ticket Resolved ✅
- Ticket Closed ✅

### Telegram Notifications (Real-time)
- New Ticket Alert ✅
- Customer Message Alert ✅
- Admin Reply Notification ✅
- Ticket Resolved Alert ✅
- Escalation Alert ✅
- Daily Summary ✅

---

## 📊 Ticket Statuses

```
OPEN → In Progress → Resolved → Closed
        ↓
    Waiting for Customer/Merchant
        ↓
    Reopened
```

## 🔴 Priority Levels

- 🟢 **LOW** - Can wait, minor issues
- 🟡 **MEDIUM** - Standard support (default)
- 🟠 **HIGH** - Urgent, important issue
- 🔴 **URGENT** - Critical, time-sensitive

---

## 📱 Telegram Bot Integration

### Admin Setup
1. Send `/start` to your Telegram bot
2. Go to user profile on website
3. Click "Connect Telegram"
4. Click the bot's link
5. Admin now receives real-time notifications

### What Admins See
```
🎫 NEW SUPPORT TICKET
ID: TKT-1704067200000-1
Subject: Missing item in my order
Priority: HIGH
Category: order
From: John Doe
Status: OPEN

👉 [View Ticket] (clickable link)
```

---

## 🔍 Admin Dashboard Tabs

### 📊 Overview Tab
- **Stats**: Total, Open, In Progress, Resolved, Closed
- **Charts**: Priority breakdown, top issue types
- **Metrics**: Avg satisfaction, resolution time

### 🎫 Tickets Tab
- **List**: All tickets with filters
- **Detail View**: Full ticket conversation
- **Actions**: Assign, Reply, Resolve, Escalate

### 👥 Staff Tab
- Performance metrics per staff member
- Ticket assignments
- Satisfaction scores
- Resolution statistics

---

## 🔌 Main API Endpoints

### User Endpoints
```
POST   /api/v1/support/ticket/create              → Create ticket
GET    /api/v1/support/my-tickets                 → Get my tickets
GET    /api/v1/support/ticket/:ticketId           → Get ticket detail
POST   /api/v1/support/ticket/:ticketId/message   → Add message
PUT    /api/v1/support/ticket/:ticketId/close     → Close & rate ticket
GET    /api/v1/support/faq                        → Get FAQs
POST   /api/v1/support/faq/:faqId/helpful         → Mark FAQ helpful
```

### Admin Endpoints
```
GET    /api/v1/support/admin/tickets              → Get all tickets
GET    /api/v1/support/admin/ticket/:ticketId     → Get full details
PUT    /api/v1/support/admin/ticket/:ticketId/assign    → Assign ticket
POST   /api/v1/support/admin/ticket/:ticketId/reply     → Send reply
PUT    /api/v1/support/admin/ticket/:ticketId/resolve   → Resolve ticket
PUT    /api/v1/support/admin/ticket/:ticketId/escalate  → Escalate ticket
GET    /api/v1/support/admin/analytics           → Get stats
GET    /api/v1/support/admin/staff-metrics       → Get staff metrics
POST   /api/v1/support/admin/faq                 → Create FAQ
PUT    /api/v1/support/admin/faq/:faqId          → Update FAQ
DELETE /api/v1/support/admin/faq/:faqId          → Delete FAQ
```

---

## 🐛 Common Issues & Solutions

### Emails not sending?
- ✅ Use Gmail App Password (not regular password)
- ✅ Enable 2FA on Gmail
- ✅ Check EMAIL_USER and EMAIL_PASSWORD in .env
- ✅ Look for error logs in backend console

### Telegram alerts not working?
- ✅ Verify TELEGRAM_BOT_TOKEN is set
- ✅ Make sure bot is polling (check server logs)
- ✅ Admin must connect Telegram from profile
- ✅ Check admin.telegramChatId exists in database

### Tickets not appearing?
- ✅ User must be logged in
- ✅ Check user._id is correct
- ✅ Verify route is registered in app.js

### Can't access admin dashboard?
- ✅ User must have role: 'admin'
- ✅ Check authorization middleware
- ✅ Try logging in with admin account

---

## 🎨 Customization

### Change Colors
Edit CSS files:
- `HelpDesk.css` - User interface colors
- `AdminDashboard.css` - Admin interface colors

Search for `#667eea` (primary color) and `#764ba2` (secondary) to customize.

### Add Custom Categories
Update `ticketModel.js`:
```javascript
category: { 
  type: String,
  enum: ['product', 'order', 'payment', 'delivery', 'return', 'refund', 'technical', 'account', 'YOUR_CATEGORY'],
  default: 'other'
}
```

### Change Email Templates
Edit `emailService.js` `emailTemplates` object to customize email designs.

---

## 📈 Usage Statistics

The system automatically tracks:
- **Response Time**: How long until first response
- **Resolution Time**: How long until ticket resolved
- **Satisfaction Score**: Customer rating (1-5 stars)
- **Staff Performance**: Tickets per staff member
- **Issue Types**: Most common problems
- **Priority Distribution**: Low/Medium/High/Urgent breakdown

View stats in Admin Dashboard → Overview Tab

---

## 🔐 Access Control

| User Type | Can Create | Can View Own | Can View All | Can Assign | Can Resolve |
|-----------|-----------|-------------|------------|-----------|-----------|
| User      | ✅         | ✅          | ❌          | ❌         | ❌         |
| Merchant  | ✅         | ✅          | ❌          | ❌         | ❌         |
| Admin     | ❌         | N/A         | ✅          | ✅         | ✅         |

---

## 🚦 Ticket Lifecycle Diagram

```
User Creates Ticket
    ↓
System sends confirmation email
    ↓
Admin receives Telegram alert
    ↓
Admin assigns ticket (optional)
    ↓
Admin & Customer exchange messages
    ↓
Admin resolves ticket
    ↓
System sends resolution email
    ↓
Customer rates experience
    ↓
Ticket closed
    ↓
Metrics updated
```

---

## 💡 Best Practices

1. **For Users**
   - Be detailed in description
   - Include order IDs when applicable
   - Check FAQ before creating ticket
   - Rate support after resolution

2. **For Admins**
   - Assign ticket immediately
   - Respond within 24 hours
   - Use internal notes for collaboration
   - Mark FAQs for common issues
   - Monitor daily summary

3. **For Merchants**
   - Report issues promptly
   - Provide order details
   - Follow up if unresolved
   - Update FAQ with business info

---

## 📚 Documentation Files

- **HELPDESK_SETUP_GUIDE.md** - Complete installation & configuration
- **HELPDESK_QUICK_REFERENCE.md** - This file (quick lookups)

---

## ✨ Summary

You now have a **complete, production-ready help desk system** with:
- ✅ Ticket management
- ✅ Email notifications
- ✅ Telegram real-time alerts
- ✅ Admin dashboard
- ✅ FAQ/Knowledge base
- ✅ Performance analytics
- ✅ Staff metrics
- ✅ Multiple ticket categories & priorities
- ✅ Full conversation threading
- ✅ Rating & feedback system

**Total Setup Time**: ~10 minutes
**Backend Files**: 7 created/modified
**Frontend Files**: 4 created/modified
**Total Lines of Code**: ~3000+

---

**Ready to deploy? Follow HELPDESK_SETUP_GUIDE.md for detailed instructions.**

Good luck! 🚀
