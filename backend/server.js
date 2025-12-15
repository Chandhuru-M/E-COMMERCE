const http = require('http');
const app = require('./app');
const path = require('path');
const connectDatabase = require('./config/database');
const { createSocketServer } = require('./socketManager');

connectDatabase();

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

// Initialize socket.io
const io = createSocketServer(server);
global.io = io; // optional convenience

// Start Telegram bot polling (after app is initialized but only once)
if (process.env.TELEGRAM_BOT_TOKEN) {
  try {
    const { startPolling } = require('./telegram/telegramBot');
    startPolling();
    console.log('✅ Telegram bot polling will start after server initialization');
  } catch (err) {
    console.error('⚠️ Error loading Telegram bot:', err.message);
  }
}

server.listen(PORT, () => {
    console.log(`My Server listening to the port: ${PORT} in ${process.env.NODE_ENV}`);
});

process.on('unhandledRejection',(err)=>{
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to unhandled rejection error');
    server.close(()=>{
        process.exit(1);
    })
})

process.on('uncaughtException',(err)=>{
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to uncaught exception error');
    server.close(()=>{
        process.exit(1);
    })
})



