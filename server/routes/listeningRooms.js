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
        },
        _count: {
          select: {
            // We'll add a participants relation later
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

// Add track to queue
router.post('/:id/queue', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { track } = req.body;
    const userId = req.user.id;

    const room = await prisma.listeningRoom.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    const currentQueue = room.queue || [];
    const updatedQueue = [...currentQueue, track];

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

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error adding track to queue:', error);
    res.status(500).json({ error: 'Failed to add track to queue' });
  }
});

// Remove track from queue
router.delete('/:id/queue/:trackId', authenticateToken, async (req, res) => {
  try {
    const { id, trackId } = req.params;
    const userId = req.user.id;

    const room = await prisma.listeningRoom.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({ error: 'Listening room not found' });
    }

    const currentQueue = room.queue || [];
    const updatedQueue = currentQueue.filter(track => track.id !== trackId);

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

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error removing track from queue:', error);
    res.status(500).json({ error: 'Failed to remove track from queue' });
  }
});

module.exports = router;