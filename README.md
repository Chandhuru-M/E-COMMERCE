# 🛍 AURA E-Commerce Platform

## 🎯 The Problem We're Solving

Traditional online shopping is frustrating:
- *Language Barriers*: Most e-commerce sites only work in English, excluding millions of regional language speakers
- *Complex Navigation*: Finding products requires multiple clicks, filters, and searches
- *Disconnected Experience*: Online and offline shopping are completely separate
- *Poor Customer Support*: Getting help means waiting hours or days for email responses
- *No Personalization*: Generic recommendations that don't understand what you actually need

## 💡 Our Solution

AURA is a next-generation e-commerce platform that combines *Artificial Intelligence, **Multi-language Support, and **Unified Shopping Experience* to make online shopping as natural as talking to a shopkeeper.

### What Makes AURA Different?

*For Customers:*
- Talk to our AI assistant in Tamil, Hindi, or English - just like chatting with a friend
- Scan any product barcode with your phone camera to instantly find it online
- Get personalized recommendations based on what you actually want, not just algorithms
- Complete your entire purchase without leaving the chat - no complicated checkout pages
- Earn loyalty points and get instant discounts on every purchase

*For Shop Owners (Merchants):*
- Use the same platform for both online orders and in-store sales (POS system)
- Manage inventory, track orders, and view sales analytics from one dashboard
- Accept payments via cash, UPI, or credit cards seamlessly
- Get instant notifications when customers need help

*For Business Administrators:*
- Complete control over users, products, and orders
- Built-in support ticket system to resolve customer issues quickly
- Real-time analytics to understand business performance
- Merchant onboarding and management tools

## 🌟 Key Features

### 🤖 AI Shopping Assistant
- *Multi-language voice chat* (Tamil, Hindi, English)
- *Barcode scanning* (camera + image upload)
- *Product search & recommendations* powered by Google Gemini AI
- *In-chat checkout* with payment processing
- *Telegram bot integration* for order updates

### 🏪 Multi-Agent Architecture
- *Sales Agent*: Product search, recommendations, cart management
- *Payment Agent*: Stripe integration, loyalty points, discounts
- *Fulfillment Agent*: Order tracking, delivery status
- *Post-Purchase Agent*: Feedback, returns, issue reporting
- *Loyalty Agent*: Points system (10% static discount + earn/redeem points)

### 💼 Business Features
- *POS System*: In-store barcode scanning, cash/UPI payments
- *Merchant Dashboard*: Inventory, orders, analytics
- *Admin Dashboard*: User/product/order management
- *Help Desk System*: Support tickets for users/merchants

### 🎨 UI/UX
- *Aditya Birla Theme*: Professional red/maroon color scheme
- *Light/Dark Mode*: Seamless theme switching with localStorage persistence
- *Responsive Design*: Mobile-first approach
- *Accessibility*: WCAG 2.1 Level AA compliant

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- Stripe Account
- Google Gemini API Key
- Telegram Bot Token (optional)

### Installation

#### 1. Clone Repository
bash
git clone <repository-url>
cd finaley


#### 2. Backend Setup
bash
cd backend
npm install


Create backend/config/config.env:
env
PORT=8000
NODE_ENV=development
DB_LOCAL_URI=mongodb://127.0.0.1:27017/HIcart
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_TIME=7d
COOKIE_EXPIRE=7

# Email (Mailtrap for dev)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
SMTP_FROM_NAME=AURA
SMTP_FROM_EMAIL=noreply@aura.com

# URLs
BACKEND_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:3000

# Stripe
STRIPE_API_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key

# AI & Integrations
GEMINI_API_KEY=your_gemini_api_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username


Start backend:
bash
npm run dev


#### 3. Frontend Setup
bash
cd frontend
npm install
npm start


Access at: http://localhost:3000

---

## 📁 Project Structure


finaley/
├── backend/
│   ├── config/          # Environment config
│   ├── controllers/     # Route controllers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middlewares/     # Auth, error handling
│   └── utils/           # Helpers, email, etc.
│
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── actions/     # Redux actions
│   │   ├── slices/      # Redux slices
│   │   ├── components/  # React components
│   │   │   ├── admin/   # Admin dashboard
│   │   │   ├── merchant/# Merchant dashboard
│   │   │   ├── pos/     # POS system
│   │   │   ├── assistant/# AI chatbot
│   │   │   └── layouts/ # Header, Footer
│   │   ├── pages/       # Page components
│   │   ├── theme/       # Theme system
│   │   └── App.js       # Main app
│   └── package.json
│
└── README.md


---

## 👥 User Roles

### 1. *Customer* (Default)
- Browse products, add to cart
- AI shopping assistant
- Order tracking
- Loyalty points
- Support tickets

### 2. *Merchant Admin*
- POS system access
- Inventory management
- Order management
- Sales analytics
- Support center

### 3. *Admin*
- Full system access
- User/merchant management
- Product management
- Order management
- Support dashboard

### 4. *Staff*
- POS system access
- Limited merchant features

---

## 🔑 Key Endpoints

### Authentication
- POST /api/v1/register - User registration
- POST /api/v1/login - User login
- GET /api/v1/logout - Logout
- GET /api/v1/myprofile - Get user profile

### Products
- GET /api/v1/products - List products
- GET /api/v1/product/:id - Product details
- GET /api/v1/barcode/:code - Barcode lookup

### Orders
- POST /api/v1/order/new - Create order
- GET /api/v1/myorders - User orders
- GET /api/v1/track/:id - Track order

### AI Assistant
- POST /api/v1/sales/parse-search - AI product search
- POST /api/v1/sales/select - Product selection
- POST /api/v1/sales/start-payment - Payment intent
- POST /api/v1/sales/complete - Complete order

### POS System
- POST /api/v1/pos/scan - Scan barcode
- POST /api/v1/pos/checkout - POS checkout
- GET /api/v1/lookup - Customer lookup

### Support
- POST /api/v1/support/ticket/create - Create ticket
- GET /api/v1/support/my-tickets - User tickets
- GET /api/v1/support/admin/tickets - Admin view

---

## 🎨 Theme System

### Light Mode (Default)
- Background: Warm Sandal Cream (#FFF7F0)
- Surface: Warm Sand (#F5E2C8)
- Text: Deep Black (#1A1A1A)
- Primary: Capital Red (#D71920)

### Dark Mode
- Background: Pure Black (#0B0B0B)
- Surface: Dark Gray (#1E1E1E)
- Text: Pure White (#FFFFFF)
- Primary: Capital Red (#D71920)

### Usage
css
/* Use CSS variables */
.my-component {
  background-color: var(--color-surface);
  color: var(--color-text);
  padding: var(--spacing-md);
}


---

## 🤖 AI Shopping Assistant

### Features
- Natural language product search
- Voice input (Tamil/Hindi/English)
- Barcode scanning
- In-chat checkout
- Payment processing
- Order confirmation

### Usage
1. Click floating chat button (bottom-right)
2. Type or speak your query
3. Scan barcodes or search products
4. Add to cart and checkout
5. Complete payment in chat

---

## 💳 Payment Flow

1. *Cart Review* → Customer adds items
2. *Loyalty Check* → Apply points/discounts
3. *Payment Intent* → Stripe creates intent
4. *Card Payment* → Customer enters card details
5. *Order Creation* → Backend creates order
6. *Loyalty Update* → Points deducted/earned
7. *Confirmation* → Order ID + tracking link

---

## 📦 Deployment

### Backend
bash
cd backend
npm run build  # If using TypeScript
npm start      # Production mode


### Frontend
bash
cd frontend
npm run build
# Deploy build/ folder to hosting (Vercel, Netlify, etc.)


### Environment Variables (Production)
- Update BACKEND_URL and FRONTEND_URL
- Use production MongoDB URI
- Use production Stripe keys
- Enable HTTPS

---

## 📚 Documentation

- *[THEME_DOCUMENTATION.md](frontend/THEME_DOCUMENTATION.md)* - Theme system guide
- *[DEPLOYMENT_GUIDE.md](frontend/DEPLOYMENT_GUIDE.md)* - Deployment instructions
- *[FINAL_SUMMARY.md](frontend/FINAL_SUMMARY.md)* - Implementation summary
- *[VISUAL_STYLE_GUIDE.md](frontend/VISUAL_STYLE_GUIDE.md)* - Design system

---

## 🧪 Testing

### Test Accounts

Admin:
Email: admin@example.com
Password: admin123

Merchant:
Email: merchant@example.com
Password: merchant123

Customer:
Email: customer@example.com
Password: customer123


### Test Cards (Stripe)

Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits


---

## 🛠 Tech Stack

### Frontend
- React 18
- Redux Toolkit
- React Router v6
- Stripe React
- Bootstrap 5
- React Toastify
- Html5-qrcode

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Stripe API
- Google Gemini AI
- Nodemailer
- Telegram Bot API

---

## 🔒 Security Features

- JWT token authentication
- HTTP-only cookies
- Password hashing (bcrypt)
- Input validation
- XSS protection
- CORS configuration
- Rate limiting (recommended)

---

## 📊 Database Models

- *User*: Authentication, profile, loyalty points
- *Product*: Inventory, pricing, barcodes
- *Order*: Order details, payment info, tracking
- *Cart*: Session-based cart management
- *Ticket*: Support ticket system
- *Tracking*: Order fulfillment tracking
- *MerchantRequest*: Merchant onboarding

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (git checkout -b feature/AmazingFeature)
3. Commit changes (git commit -m 'Add AmazingFeature')
4. Push to branch (git push origin feature/AmazingFeature)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Authors

AURA E-Commerce Team © 2025

---

## 🙏 Acknowledgments

- Google Gemini AI for intelligent search
- Stripe for payment processing
- Telegram for bot integration
- React community for amazing tools

---

## 📞 Support

For issues or questions:
- Email: auraecommerce248@gmail.com
- Create a support ticket in the app


---

*Built with ❤ using React, Node.js, and AI*

