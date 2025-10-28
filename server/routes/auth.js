const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const spotifyService = require('../services/spotify');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate Spotify OAuth URL
router.get('/spotify', (req, res) => {
  const scopes = [
    'user-read-email',
    'user-read-private',
    'user-top-read',
    'user-read-recently-played',
    'user-library-read',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    // Added for playlists
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
  ].join(' ');

  const authURL = `https://accounts.spotify.com/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}&` +
    `show_dialog=true`;

  res.json({ authURL });
});

// Handle Spotify OAuth callback
router.post('/spotify/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Debug logging (can be removed in production)
    console.log('🔍 OAuth Callback Debug:');
    console.log('  - Code received:', code ? code.substring(0, 20) + '...' : 'MISSING');

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Check if this code has already been processed (prevent duplicate requests)
    const codeKey = `oauth_code_${code}`;
    if (global.processedCodes && global.processedCodes.has(codeKey)) {
      console.log('⚠️  Authorization code already processed, silently ignoring duplicate request');
      // Return 200 with a flag instead of error, since this is likely from React Strict Mode
      // The first request already succeeded
      return res.status(200).json({ 
        success: false, 
        message: 'Authorization code already processed',
        duplicate: true
      });
    }

    // Mark code as being processed
    if (!global.processedCodes) {
      global.processedCodes = new Set();
    }
    global.processedCodes.add(codeKey);
    
    // Clean up old codes (keep only last 100 to prevent memory leaks)
    if (global.processedCodes.size > 100) {
      const codesArray = Array.from(global.processedCodes);
      global.processedCodes = new Set(codesArray.slice(-50));
    }

    // Get access token from Spotify
    const tokenData = await spotifyService.getAccessToken(code);
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user profile from Spotify
    const spotifyProfile = await spotifyService.getUserProfile(access_token);

    // Check if user exists in our database
    let user = await prisma.user.findUnique({
      where: { spotifyId: spotifyProfile.id },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: spotifyProfile.email,
          username: spotifyProfile.display_name || spotifyProfile.id,
          displayName: spotifyProfile.display_name,
          avatar: spotifyProfile.images?.[0]?.url,
          spotifyId: spotifyProfile.id,
        },
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          displayName: spotifyProfile.display_name,
          avatar: spotifyProfile.images?.[0]?.url,
        },
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        spotifyId: user.spotifyId,
      },
      spotifyAccessToken: access_token,
      spotifyRefreshToken: refresh_token,
      expiresIn: expires_in,
    });
  } catch (error) {
    console.error('Spotify OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        spotifyId: true,
        isPublic: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { displayName, bio, isPublic } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        displayName,
        bio,
        isPublic,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        spotifyId: true,
        isPublic: true,
      },
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
