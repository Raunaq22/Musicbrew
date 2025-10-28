require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const musicRoutes = require('./routes/music');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const playlistRoutes = require('./routes/playlists');
const adminRoutes = require('./routes/admin');
const listeningRoomRoutes = require('./routes/listeningRooms');
const analyticsRoutes = require('./routes/analytics');
const discoveryRoutes = require('./routes/discovery');
const homeRoutes = require('./routes/home');

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Socket.IO configuration
const io = socketIo(server, { 
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'MusicBrew API Server',
    version: '1.0.0',
    status: 'running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/listening-rooms', listeningRoomRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/home', homeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join listening room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('user-joined', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Leave listening room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    io.to(roomId).emit('user-left', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  // Real-time chat messages
  socket.on('chat-message', ({ roomId, message, username }) => {
    const chatData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      username,
      timestamp: new Date().toISOString(),
      userId: socket.id
    };
    io.to(roomId).emit('new-chat-message', chatData);
  });

  // Track controls (play, pause, skip, etc.)
  socket.on('track-control', ({ roomId, action, track, position = 0 }) => {
    const controlData = {
      action, // 'play', 'pause', 'skip', 'seek'
      track,
      position,
      timestamp: new Date().toISOString(),
      userId: socket.id
    };
    socket.to(roomId).emit('track-control-update', controlData);
  });

  // Queue updates
  socket.on('queue-update', ({ roomId, queue }) => {
    socket.to(roomId).emit('queue-updated', {
      queue,
      updatedBy: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Room state synchronization request
  socket.on('sync-room-state', async (roomId) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const room = await prisma.listeningRoom.findUnique({
        where: { id: roomId },
        include: {
          host: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      if (room) {
        socket.emit('room-state-sync', room);
      }
    } catch (error) {
      console.error('Error syncing room state:', error);
      socket.emit('sync-error', { message: 'Failed to sync room state' });
    }
  });

  // Typing indicators
  socket.on('typing-start', ({ roomId, username }) => {
    socket.to(roomId).emit('user-typing', { username, userId: socket.id });
  });

  socket.on('typing-stop', ({ roomId, username }) => {
    socket.to(roomId).emit('user-stopped-typing', { username, userId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Handle cleanup - notify all rooms the user was in
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        io.to(roomId).emit('user-disconnected', {
          userId: socket.id,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`MusicBrew Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});