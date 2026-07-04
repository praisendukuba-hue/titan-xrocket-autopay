require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const { initSocket } = require('./services/socketService');
const autopayRoutes = require('./routes/autopay');

const app = express();
const server = http.createServer(app);

// 🔌 Initialize Socket.io
initSocket(server);

// 🛡️ Security Middleware
app.use(helmet());
app.use(express.json());

// ⏱️ Rate Limiting (Prevent API abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
});
app.use('/api/', limiter);

// 🛣️ Routes
app.use('/api/autopay', autopayRoutes);

// 🩺 Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// 🏁 Start Server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
}).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
