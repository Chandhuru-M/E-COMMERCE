
const express = require('express');
const app = express();
const errorMiddleware = require('./middlewares/error');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, 'config/config.env') });
const posRoutes = require('./routes/posRoutes');
const barcodeRoutes = require('./routes/barcodeRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Core routes
app.use('/api/v1', require('./routes/product'));
app.use('/api/v1', require('./routes/auth'));
app.use('/api/v1', require('./routes/user'));
app.use('/api/v1', require('./routes/order'));
app.use('/api/v1', require('./routes/paymentRoute'));
app.use('/api/v1', require('./routes/assistantRoute'));
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


// Production Frontend Handling
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
    });
}

app.use(errorMiddleware);
module.exports = app;
