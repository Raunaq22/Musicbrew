require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

// Import routes
const authRoutes = require('./routes/auth');
const musicRoutes = require('./routes/music');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const playlistRoutes = require('./routes/playlists');
const adminRoutes = require('./routes/admin');
const homeRoutes = require('./routes/home');
const rssPublicRoutes = require('./routes/rss-public');

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

// Audio proxy route to handle Deezer preview URLs
app.get('/api/audio/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Set CORS headers for audio streaming
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    res.setHeader('Accept-Ranges', 'bytes');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Fetch the audio file directly from Deezer
    const response = await axios({
      method: 'GET',
      url: decodeURIComponent(url),
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'audio/*,audio/mpeg,audio/mp3,application/octet-stream,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'audio',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'Range': 'bytes=0-',
        'Cache-Control': 'no-cache',
      },
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024, // 10MB max
    });

    // Set content type and headers for audio
    res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Handle range requests for seeking
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
    }

    // Stream the response directly to the client
    response.data.pipe(res);

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    console.log('Successfully proxying Deezer audio stream');

  } catch (error) {
    console.error('Audio proxy error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({ 
        error: 'Failed to fetch audio from source',
        details: error.message
      });
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      res.status(408).json({ 
        error: 'Request timeout',
        message: 'The audio source took too long to respond'
      });
    } else {
      res.status(500).json({ 
        error: 'Audio proxy failed',
        message: error.message
      });
    }
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const rssLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs for RSS feeds
  message: 'Too many RSS requests from this IP, please try again later.',
});

app.use('/api/public', rssLimiter);
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
app.use('/api/home', homeRoutes);
app.use('/api/public', rssPublicRoutes);

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
  // Typing indicators
  socket.on('typing-start', ({ roomId, username }) => {
    socket.to(roomId).emit('user-typing', { username, userId: socket.id });
  });

  socket.on('typing-stop', ({ roomId, username }) => {
    socket.to(roomId).emit('user-stopped-typing', { username, userId: socket.id });
  });

  socket.on('disconnect', () => {
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
});