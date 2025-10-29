const express = require('express');
const spotifyService = require('../services/spotify');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search for music (Spotify only - requires authentication)
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'track', limit = 20, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const { accesstoken } = req.headers;
    if (!accesstoken) {
      return res.status(401).json({ error: 'Spotify access token required for music search. Please sign in with Spotify.' });
    }

    const results = await spotifyService.search(q, type, parseInt(limit), parseInt(offset), accesstoken);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed: ' + error.message });
  }
});

// Get track details (Spotify - requires authentication)
router.get('/track/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { accesstoken } = req.headers;

    if (!accesstoken) {
      return res.status(400).json({ error: 'Spotify access token required' });
    }

    const track = await spotifyService.getTrack(id, accesstoken);
    res.json({
      ...track,
      source: 'spotify'
    });
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ error: 'Failed to get track' });
  }
});

// Get album details (Spotify - requires authentication)
router.get('/album/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { accesstoken } = req.headers;

    if (!accesstoken) {
      return res.status(400).json({ error: 'Spotify access token required' });
    }

    const album = await spotifyService.getAlbum(id, accesstoken);
    res.json(album);
  } catch (error) {
    console.error('Get album error:', error);
    res.status(500).json({ error: 'Failed to get album' });
  }
});

// Get artist details (Spotify - requires authentication)
router.get('/artist/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { accesstoken } = req.headers;

    if (!accesstoken) {
      return res.status(400).json({ error: 'Spotify access token required' });
    }

    const artist = await spotifyService.getArtist(id, accesstoken);
    res.json(artist);
  } catch (error) {
    console.error('Get artist error:', error);
    res.status(500).json({ error: 'Failed to get artist' });
  }
});

// Get user's top tracks (Spotify - requires authentication)
router.get('/top/tracks', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'medium_term', limit = 20 } = req.query;
    const { accesstoken } = req.headers;

    if (!accesstoken) {
      return res.status(400).json({ error: 'Spotify access token required' });
    }

    const tracks = await spotifyService.getTopTracks(accesstoken, timeRange, parseInt(limit));
    res.json(tracks);
  } catch (error) {
    console.error('Get top tracks error:', error);
    res.status(500).json({ error: 'Failed to get top tracks' });
  }
});

// Get user's top artists (Spotify - requires authentication)
router.get('/top/artists', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'medium_term', limit = 20 } = req.query;
    const { accesstoken } = req.headers;

    if (!accesstoken) {
      return res.status(400).json({ error: 'Spotify access token required' });
    }

    const artists = await spotifyService.getTopArtists(accesstoken, timeRange, parseInt(limit));
    res.json(artists);
  } catch (error) {
    console.error('Get top artists error:', error);
    res.status(500).json({ error: 'Failed to get top artists' });
  }
});

// Get trending music (Spotify only)
router.get('/trending', async (req, res) => {
  try {
    const { type = 'track', limit = 20 } = req.query;
    const { accesstoken } = req.headers;

    if (!accesstoken) {
      return res.status(401).json({ error: 'Spotify access token required for trending music. Please sign in with Spotify.' });
    }

    // Search for trending music
    const trendingQuery = 'year:2024';
    const trending = await spotifyService.search(trendingQuery, type, parseInt(limit), 0, accesstoken);
    
    res.json(trending);
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ error: 'Failed to get trending music: ' + error.message });
  }
});

module.exports = router;