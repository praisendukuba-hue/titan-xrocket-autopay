hereconst { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // 🔐 Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token === process.env.SOCKET_SECRET) {
      next();
    } else {
      next(new Error("Authentication error"));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Join user-specific room for targeted notifications
    socket.on('join_user_room', (telegramId) => {
      socket.join(`user_${telegramId}`);
      console.log(`User ${telegramId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// 📢 Helper to push notifications to specific users
const notifyUser = (telegramId, event, data) => {
  if (io) {
    io.to(`user_${telegramId}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  notifyUser
};
