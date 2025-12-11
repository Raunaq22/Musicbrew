const express = require('express');
const { body, validationResult } = require('express-validator');
const { getPrisma } = require('../prisma-util');
const { authenticateToken } = require('../middleware/auth');
const spotifyService = require('../services/spotify');

const router = express.Router();

// Get playlists
router.get('/', async (req, res) => {
  try {
    const { 
      userId, 
      limit = 20, 
      offset = 0 
    } = req.query;

    const where = {};
    
    if (userId) where.userId = userId;
    // Privacy filter removed; all playlists are public

    const playlists = await getPrisma().playlist.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ playlists });
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});

// Get a single playlist
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const playlist = await getPrisma().playlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // All playlists are public; no privacy restriction

    res.json({ playlist });
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

// Get playlist tracks (from Spotify if linked)
router.get('/:id/tracks', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { accesstoken } = req.headers;

    const playlist = await getPrisma().playlist.findUnique({ where: { id } });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // All playlists are public

    if (!playlist.spotifyId) {
      return res.json({ tracks: [] });
    }

    if (!accesstoken) {
      return res.status(400).json({ error: 'Spotify access token required' });
    }

    const data = await spotifyService.getPlaylistTracks(playlist.spotifyId, accesstoken, 50, 0);
    const tracks = (data.items || []).map((item) => {
      const t = item.track || {};
      return {
        id: t.id,
        name: t.name,
        artists: (t.artists || []).map(a => a.name),
        album: t.album?.name,
        image: t.album?.images?.[0]?.url,
        durationMs: t.duration_ms,
        uri: t.uri,
      };
    });

    res.json({ tracks });
  } catch (error) {
    console.error('Get playlist tracks error:', error);
    res.status(500).json({ error: 'Failed to get playlist tracks' });
  }
});

// Create a playlist (also on Spotify if possible)
router.post('/', 
  authenticateToken,
  [
    body('name').notEmpty().withMessage('Playlist name is required').isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;
      const { accesstoken } = req.headers;

      // Create on Spotify if we have user's spotifyId and access token
      let spotifyId = null;
      let spotifyPlaylistData = null;
      if (req.user.spotifyId && accesstoken) {
        try {
          const sp = await spotifyService.createPlaylist(req.user.spotifyId, name, description || '', true, accesstoken);
          spotifyId = sp.id;
          spotifyPlaylistData = sp;
        } catch (e) {
          console.warn('Spotify playlist create failed, proceeding with local only:', e.message);
        }
      }

      const playlist = await getPrisma().playlist.create({
        data: {
          userId: req.user.id,
          name,
          description,
          isPublic: true,
          spotifyId,
          coverImage: spotifyId && spotifyPlaylistData ? spotifyService.extractPlaylistCover(spotifyPlaylistData) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });

      res.json({ playlist });
    } catch (error) {
      console.error('Create playlist error:', error);
      res.status(500).json({ error: 'Failed to create playlist' });
    }
  }
);

// Import a Spotify playlist into local DB
router.post('/import', 
  authenticateToken,
  [
    body('spotifyPlaylistId').notEmpty().withMessage('spotifyPlaylistId is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { spotifyPlaylistId } = req.body;
      const { accesstoken } = req.headers;

      if (!accesstoken) {
        return res.status(400).json({ error: 'Spotify access token required' });
      }

      const spPlaylist = await spotifyService.getPlaylist(spotifyPlaylistId, accesstoken);

      // Upsert by spotifyId
      const playlist = await getPrisma().playlist.upsert({
        where: { spotifyId: spotifyPlaylistId },
        update: {
          name: spPlaylist.name || 'Imported Playlist',
          description: spPlaylist.description || null,
          isPublic: !!spPlaylist.public,
          coverImage: spotifyService.extractPlaylistCover(spPlaylist),
        },
        create: {
          userId: req.user.id,
          name: spPlaylist.name || 'Imported Playlist',
          description: spPlaylist.description || null,
          isPublic: !!spPlaylist.public,
          spotifyId: spotifyPlaylistId,
          coverImage: spotifyService.extractPlaylistCover(spPlaylist),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });

      res.json({ playlist });
    } catch (error) {
      console.error('Import playlist error:', error);
      res.status(500).json({ error: 'Failed to import Spotify playlist' });
    }
  }
);

// Update a playlist
router.put('/:id',
  authenticateToken,
  [
    body('name').optional().isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, description } = req.body;
      const { accesstoken } = req.headers;

      // Check if playlist exists and belongs to user
      const existingPlaylist = await getPrisma().playlist.findUnique({
        where: { id },
      });

      if (!existingPlaylist) {
        return res.status(404).json({ error: 'Playlist not found' });
      }

      if (existingPlaylist.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this playlist' });
      }

      // Update Spotify if linked and token present
      if (existingPlaylist.spotifyId && accesstoken) {
        try {
          await spotifyService.updatePlaylistDetails(existingPlaylist.spotifyId, accesstoken, {
            name,
            description,
            isPublic: true,
          });
        } catch (e) {
          console.warn('Spotify update failed; continuing with DB update:', e.message);
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      // Always public
      updateData.isPublic = true;

      const playlist = await getPrisma().playlist.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });

      // Sync cover image if playlist is linked to Spotify
      if (existingPlaylist.spotifyId && accesstoken) {
        try {
          const spPlaylist = await spotifyService.getPlaylist(existingPlaylist.spotifyId, accesstoken);
          await spotifyService.updatePlaylistCover(prisma, id, spPlaylist);
        } catch (e) {
          console.warn('Failed to sync cover image:', e.message);
        }
      }

      res.json({ playlist });
    } catch (error) {
      console.error('Update playlist error:', error);
      res.status(500).json({ error: 'Failed to update playlist' });
    }
  }
);

// Delete a playlist
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { accesstoken } = req.headers;

    // Check if playlist exists and belongs to user
    const existingPlaylist = await getPrisma().playlist.findUnique({
      where: { id },
    });

    if (!existingPlaylist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (existingPlaylist.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this playlist' });
    }

    // Remove from Spotify library if linked and token present (unfollow)
    if (existingPlaylist.spotifyId && accesstoken) {
      try {
        await spotifyService.unfollowPlaylist(existingPlaylist.spotifyId, accesstoken);
      } catch (e) {
        console.warn('Spotify unfollow failed; deleting locally anyway:', e.message);
      }
    }

    await getPrisma().playlist.delete({
      where: { id },
    });

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// Sync playlist cover image from Spotify
router.post('/:id/sync-cover', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { accesstoken } = req.headers;

    const playlist = await getPrisma().playlist.findUnique({ where: { id } });
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to sync this playlist' });
    }

    if (!playlist.spotifyId) {
      return res.status(400).json({ error: 'Playlist is not linked to Spotify' });
    }

    if (!accesstoken) {
      return res.status(400).json({ error: 'Spotify access token required' });
    }

    try {
      const spPlaylist = await spotifyService.getPlaylist(playlist.spotifyId, accesstoken);
      const coverImage = spotifyService.extractPlaylistCover(spPlaylist);
      
      if (coverImage) {
        const updatedPlaylist = await getPrisma().playlist.update({
          where: { id },
          data: { coverImage },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        });
        
        return res.json({ 
          success: true, 
          playlist: updatedPlaylist,
          message: 'Cover image synced successfully' 
        });
      } else {
        return res.status(404).json({ error: 'No cover image found on Spotify' });
      }
    } catch (spotifyError) {
      throw new Error('Failed to fetch from Spotify: ' + spotifyError.message);
    }
  } catch (error) {
    console.error('Sync cover error:', error);
    res.status(500).json({ error: 'Failed to sync cover image' });
  }
});

// Add tracks to a Spotify-linked playlist
router.post('/:id/tracks', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { uris } = req.body; // array of spotify:track:{id} URIs
    const { accesstoken } = req.headers;

    if (!Array.isArray(uris) || uris.length === 0) {
      return res.status(400).json({ error: 'uris must be a non-empty array' });
    }

    const playlist = await getPrisma().playlist.findUnique({ where: { id } });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    if (playlist.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this playlist' });
    }

    if (!playlist.spotifyId) {
      return res.status(400).json({ error: 'Playlist is not linked to Spotify' });
    }

    if (!accesstoken) {
      return res.status(400).json({ error: 'Spotify access token required' });
    }

    const result = await spotifyService.addTracksToPlaylist(playlist.spotifyId, uris, accesstoken);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Add tracks error:', error);
    res.status(500).json({ error: 'Failed to add tracks to playlist' });
  }
});

module.exports = router;

