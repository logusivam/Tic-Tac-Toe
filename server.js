const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./src/config/db');
const gameSockets = require('./src/sockets/gameSockets');
const userRoutes = require('./src/routes/api/v1/users');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL
}));
app.use(express.json());

// API Routes
app.use('/api/v1/users', userRoutes);

// Root route mapped to index.html is handled by express.static naturally

// Setup Sockets
gameSockets(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
