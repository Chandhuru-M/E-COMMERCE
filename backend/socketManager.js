// socketManager.js
const { Server } = require('socket.io');
let ioInstance = null;

function createSocketServer(httpServer) {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_ORIGIN || '*', methods: ['GET', 'POST'] },
    path: '/socket.io'
  });

  ioInstance.on('connection', socket => {
    console.log('WS connected', socket.id);

    socket.on('joinOrderRoom', orderId => {
      if (orderId) socket.join(`order_${orderId}`);
    });

    socket.on('disconnect', () => console.log('WS disconnected', socket.id));
  });

  return ioInstance;
}

function getIo() {
  if (!ioInstance) throw new Error('Socket not initialized');
  return ioInstance;
}

module.exports = { createSocketServer, getIo };
