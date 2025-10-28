const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all active listening rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await prisma.listeningRoom.findMany({
      where: { isActive: true },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching listening rooms:', error);
    res.status(500).json({ error: 'Failed to fetch listening rooms' });
  }
});

// Create a new listening room
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    const room = await prisma.listeningRoom.create({
      data: {
        name,
        description,
        hostId: userId,
        queue: []
      },
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

    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating listening room:', error);
    res.status(500).json({ error: 'Failed to create listening room' });
  }
});

// Get a specific listening room
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const room = await prisma.listeningRoom.findUnique({
      where: { id },
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

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching listening room:', error);
    res.status(500).json({ error: 'Failed to fetch listening room' });
  }
});

// Update listening room (host only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, currentTrack, queue } = req.body;
    const userId = req.user.id;

    // Check if user is the host
    const room = await prisma.listeningRoom.findUnique({
      where: { id },
      select: { hostId: true }
    });

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    if (room.hostId !== userId) {
      return res.status(403).json({ error: 'Only the host can update this room' });
    }

    const updatedRoom = await prisma.listeningRoom.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(currentTrack && { currentTrack }),
        ...(queue && { queue })
      },
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

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error updating listening room:', error);
    res.status(500).json({ error: 'Failed to update listening room' });
  }
});

// Join a listening room
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const room = await prisma.listeningRoom.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    // Add room ID to user's joined rooms (you might want to track this)
    // For now, we'll just return the room data
    res.json({ message: 'Joined room successfully', roomId: id });
  } catch (error) {
    console.error('Error joining listening room:', error);
    res.status(500).json({ error: 'Failed to join listening room' });
  }
});

// Leave a listening room
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const room = await prisma.listeningRoom.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving listening room:', error);
    res.status(500).json({ error: 'Failed to leave listening room' });
  }
});

// End a listening room (host only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is the host
    const room = await prisma.listeningRoom.findUnique({
      where: { id },
      select: { hostId: true }
    });

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    if (room.hostId !== userId) {
      return res.status(403).json({ error: 'Only the host can end this room' });
    }

    await prisma.listeningRoom.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Listening room ended successfully' });
  } catch (error) {
    console.error('Error ending listening room:', error);
    res.status(500).json({ error: 'Failed to end listening room' });
  }
});

// Add track to queue (enhanced)
router.post('/:id/queue', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { track, position } = req.body; // Support optional position
    const userId = req.user.id;

    const room = await prisma.listeningRoom.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    const currentQueue = Array.isArray(room.queue) ? room.queue : [];
    
    // Validate track data
    if (!track || !track.id || !track.name || !track.artist) {
      return res.status(400).json({ error: 'Invalid track data' });
    }

    const queueTrack = {
      id: track.id,
      name: track.name,
      artist: track.artist,
      album: track.album || '',
      duration: track.duration || 0,
      artwork: track.artwork || '',
      addedBy: userId,
      addedAt: new Date().toISOString(),
      preview_url: track.preview_url || null,
      spotify_url: track.spotify_url || null
    };

    let updatedQueue;
    if (position !== undefined && position >= 0 && position <= currentQueue.length) {
      // Insert at specific position
      updatedQueue = [...currentQueue];
      updatedQueue.splice(position, 0, queueTrack);
    } else {
      // Add to end
      updatedQueue = [...currentQueue, queueTrack];
    }

    const updatedRoom = await prisma.listeningRoom.update({
      where: { id },
      data: { queue: updatedQueue },
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

    res.json({
      message: 'Track added to queue',
      queue: updatedRoom.queue,
      room: updatedRoom
    });
  } catch (error) {
    console.error('Error adding track to queue:', error);
    res.status(500).json({ error: 'Failed to add track to queue' });
  }
});

// Remove track from queue
router.delete('/:id/queue/:trackId', authenticateToken, async (req, res) => {
  try {
    const { id, trackId } = req.params;

    const room = await prisma.listeningRoom.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    const currentQueue = Array.isArray(room.queue) ? room.queue : [];
    const updatedQueue = currentQueue.filter(track => track.id !== trackId);

    const updatedRoom = await prisma.listeningRoom.update({
      where: { id },
      data: { 
        queue: updatedQueue,
        ...(currentQueue.length > 0 && updatedQueue.length === 0 && { currentTrack: null })
      },
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

    res.json({
      message: 'Track removed from queue',
      queue: updatedRoom.queue,
      room: updatedRoom
    });
  } catch (error) {
    console.error('Error removing track from queue:', error);
    res.status(500).json({ error: 'Failed to remove track from queue' });
  }
});

// Reorder queue
router.put('/:id/queue/reorder', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { trackIds } = req.body; // Array of track IDs in new order

    if (!Array.isArray(trackIds)) {
      return res.status(400).json({ error: 'trackIds must be an array' });
    }

    const room = await prisma.listeningRoom.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    const currentQueue = Array.isArray(room.queue) ? room.queue : [];
    const trackMap = new Map(currentQueue.map(track => [track.id, track]));
    const reorderedQueue = trackIds.map(id => trackMap.get(id)).filter(Boolean);

    const updatedRoom = await prisma.listeningRoom.update({
      where: { id },
      data: { queue: reorderedQueue },
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

    res.json({
      message: 'Queue reordered',
      queue: updatedRoom.queue,
      room: updatedRoom
    });
  } catch (error) {
    console.error('Error reordering queue:', error);
    res.status(500).json({ error: 'Failed to reorder queue' });
  }
});

// Set current track
router.put('/:id/current-track', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { trackId } = req.body;

    const room = await prisma.listeningRoom.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    const currentQueue = Array.isArray(room.queue) ? room.queue : [];
    const track = currentQueue.find(t => t.id === trackId);

    if (!track) {
      return res.status(404).json({ error: 'Track not found in queue' });
    }

    const updatedRoom = await prisma.listeningRoom.update({
      where: { id },
      data: { currentTrack: track },
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

    res.json({
      message: 'Current track updated',
      currentTrack: updatedRoom.currentTrack,
      room: updatedRoom
    });
  } catch (error) {
    console.error('Error setting current track:', error);
    res.status(500).json({ error: 'Failed to set current track' });
  }
});

// Search and add tracks (combines search + add to queue)
router.post('/:id/search-and-add', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { query, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // For now, return mock results - in real implementation you'd call Spotify
    const mockResults = [
      {
        id: `spotify:track:${Date.now()}`,
        name: `${query} - Radio Edit`,
        artist: 'Popular Artist',
        album: 'Latest Album',
        duration: 180000,
        preview_url: null,
        artwork: 'https://via.placeholder.com/64'
      },
      {
        id: `spotify:track:${Date.now() + 1}`,
        name: `${query} (feat. Someone)`,
        artist: 'Another Artist',
        album: 'Single',
        duration: 210000,
        preview_url: null,
        artwork: 'https://via.placeholder.com/64'
      }
    ].slice(0, limit);

    res.json({
      query,
      results: mockResults,
      source: 'demo'
    });
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

module.exports = router;