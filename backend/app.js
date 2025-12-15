// app.js
const express = require('express');
const app = express();
const errorMiddleware = require('./middlewares/error');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, 'config/config.env') });

// IMPORTANT: require telegram bot - polling will be started manually in server.js
// This prevents duplicate polling instances
const { startPolling } = require("./telegram/telegramBot");

const cors = require("cors");
const posRoutes = require('./routes/posRoutes');
const barcodeRoutes = require('./routes/barcodeRoutes');
const merchantRoutes = require('./routes/merchantRoutes');

process.once("SIGUSR2", () => {
  process.kill(process.pid, "SIGUSR2");
});


// CORS - allow your frontend(s)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Core routes
app.use('/api/v1', require('./routes/product'));
app.use('/api/v1', require('./routes/auth'));
app.use('/api/v1', require('./routes/user'));
app.use('/api/v1', require('./routes/order'));
app.use('/api/v1', require('./routes/paymentRoute'));
app.use('/api/v1', require('./routes/assistantRoute'));  // POST /api/v1/assistant
app.use('/api/v1/pos', posRoutes);
app.use('/api/v1/barcode', barcodeRoutes);
app.use('/api/v1/merchant', merchantRoutes);
// ------------------------------
// AI AGENT MICRO-SERVICES
// ------------------------------

// 1. Recommendation Engine
// salesAgent.js expects: /api/v1/recommend/search & /api/v1/recommend/select
app.use('/api/v1/recommend', require('./routes/recommendRoutes'));

// 2. Inventory Service
// salesAgent.js expects:
//   /api/v1/inventory/reserve
//   /api/v1/inventory/confirm
app.use('/api/v1/inventory', require('./routes/inventoryRoutes'));

// 3. Loyalty Engine
// salesAgent.js expects:
//   /api/v1/loyalty/apply
//   /api/v1/loyalty/finalize
app.use('/api/v1/loyalty', require('./routes/loyaltyRoutes'));

// 4. Payment Gateway Used by AI Agent
// salesAgent.js expects: /api/v1/start-payment
app.use('/api/v1', require('./routes/paymentAgentRoute'));

// 5. Fulfillment Scheduling
// salesAgent.js expects: /api/v1/fulfillment/schedule
app.use('/api/v1/fulfillment', require('./routes/fulfillmentRoutes'));

// 6. Post-Purchase Service
// salesAgent.js expects: /api/v1/postpurchase/create
app.use('/api/v1/postpurchase', require('./routes/postPurchaseRoutes'));

// 7. Sales Agent Interaction Route
app.use('/api/v1', require('./routes/salesRoutes'));

// Help Desk / Support Tickets
app.use('/api/v1/support', require('./routes/helpDeskRoute'));

// Telegram routes (kept from the first file)
const telegramRoutes = require("./routes/telegramRoutes");
app.use("/api/users/telegram", telegramRoutes);

// Production Frontend Handling
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
  });
}

// Error middleware (should be last)
app.use(errorMiddleware);

module.exports = app;
