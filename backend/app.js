// const express = require('express');
// const app = express();
// const errorMiddleware = require('./middlewares/error');
// const cookieParser = require('cookie-parser')
// const path = require('path')
// const dotenv = require('dotenv');
// dotenv.config({path:path.join(__dirname,"config/config.env")});


// app.use(express.json());
// app.use(cookieParser());
// app.use('/uploads', express.static(path.join(__dirname,'uploads') ) )

// const products = require('./routes/product')
// const auth = require('./routes/auth')
// const user = require("./routes/user"); // Reverted to 'user'
// const order = require("./routes/order"); 
// const payment = require("./routes/paymentRoute");
// const assistant = require("./routes/assistantRoute"); // Import assistant route

// app.use('/api/v1/',products);
// app.use('/api/v1/',auth);
// app.use('/api/v1/',user);
// app.use('/api/v1/',order);
// app.use('/api/v1/',payment);
// app.use('/api/v1/', assistant); // Use assistant route

// if(process.env.NODE_ENV === "production") {
//     app.use(express.static(path.join(__dirname, '../frontend/build')));
//     app.get('*', (req, res) =>{
//         res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
//     })
// }
// const recommendRoutes = require("./routes/recommendRoutes");
// app.use("/api/v1", recommendRoutes);
// const inventoryRoutes = require("./routes/inventoryRoutes");
// app.use("/api/v1/inventory", inventoryRoutes);
// const loyaltyRoutes = require("./routes/loyaltyRoutes");
// app.use("/api/v1/", loyaltyRoutes);
// const paymentAgentRoute = require("./routes/paymentAgentRoute");
// app.use("/api/v1/", paymentAgentRoute);
// const fulfillmentRoutes = require("./routes/fulfillmentRoutes");
// app.use("/api/v1/fulfillment", fulfillmentRoutes);

// // ✅ FIXED: Proper mount for post-purchase
// const postPurchaseRoutes = require("./routes/postPurchaseRoutes");
// app.use("/api/v1/postpurchase", postPurchaseRoutes);
// const salesRoutes = require("./routes/salesRoutes");
// app.use("/api/v1", salesRoutes);



// app.use(errorMiddleware)

// module.exports = app;
const express = require('express');
const app = express();
const errorMiddleware = require('./middlewares/error');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, 'config/config.env') });

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
