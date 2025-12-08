const express = require('express');
const app = express();
const errorMiddleware = require('./middlewares/error');
const cookieParser = require('cookie-parser')
const path = require('path')
const dotenv = require('dotenv');
dotenv.config({path:path.join(__dirname,"config/config.env")});


app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname,'uploads') ) )

const products = require('./routes/product')
const auth = require('./routes/auth')
const user = require("./routes/user"); // Reverted to 'user'
// const order = require("./routes/orderRoute"); 
const payment = require("./routes/paymentRoute");
const assistant = require("./routes/assistantRoute"); // Import assistant route

app.use('/api/v1/',products);
app.use('/api/v1/',auth);
app.use('/api/v1/',user);
app.use('/api/v1/',payment);
app.use('/api/v1/', assistant); // Use assistant route

if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) =>{
        res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
    })
}
const recommendRoutes = require("./routes/recommendRoutes");
app.use("/api/v1", recommendRoutes);
const inventoryRoutes = require("./routes/inventoryRoutes");
app.use("/api/v1/", inventoryRoutes);
const loyaltyRoutes = require("./routes/loyaltyRoutes");
app.use("/api/v1/", loyaltyRoutes);
const paymentAgentRoute = require("./routes/paymentAgentRoute");
app.use("/api/v1/", paymentAgentRoute);
const fulfillmentRoutes = require("./routes/fulfillmentRoutes");
app.use("/api/v1/", fulfillmentRoutes);
// const salesAgentRoute = require("./routes/salesAgentRoute");
// app.use("/api/v1/", salesAgentRoute);

app.use(errorMiddleware)

module.exports = app;