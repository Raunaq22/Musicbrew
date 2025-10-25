const express = require('express');
const spotifyService = require('../services/spotify');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search for music
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, type = 'track', limit = 20, offset = 0 } = req.query;
    const { accesstoken } = req.headers;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    if (!accesstoken) {
      return res.status(400).json({ error: 'Spotify access token required' });
    }

    const results = await spotifyService.search(q, type, parseInt(limit), parseInt(offset), accesstoken);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get track details
router.get('/track/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { accesstoken } = req.headers;

    if (!accesstoken) {
      return res.status(400).json({ error: 'Spotify access token required' });
    }

    const track = await spotifyService.getTrack(id, accesstoken);
    res.json(track);
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ error: 'Failed to get track' });
  }
});

// Get album details
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

// Get artist details
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

// Get user's top tracks
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

// Get user's top artists
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

// Get trending music (placeholder - would need to implement trending logic)
router.get('/trending', async (req, res) => {
  try {
    const { type = 'track', limit = 20 } = req.query;
    
    // This is a placeholder - in a real implementation, you'd track
    // which music is being reviewed/rated most frequently
    const trendingQuery = 'year:2024'; // Example trending query
    const results = await spotifyService.search(trendingQuery, type, parseInt(limit), 0);
    
    res.json(results);
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ error: 'Failed to get trending music' });
  }
});

module.exports = router;
