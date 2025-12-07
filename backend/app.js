const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load ENV FIRST
dotenv.config({ path: path.join(__dirname, "config/config.env") });

// Middlewares FIRST
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROUTES IMPORT
const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const payment = require('./routes/payment');
const chatbotRouter = require("./routes/chatbot");

// ROUTES
app.use('/api/v1/', products);
app.use('/api/v1/', auth);
app.use('/api/v1/', order);
app.use('/api/v1/', payment);

// Chatbot Route
app.use("/api/chatbot", chatbotRouter);

// PRODUCTION MODE
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
    });
}

const errorMiddleware = require('./middlewares/error');
app.use(errorMiddleware);

module.exports = app;
