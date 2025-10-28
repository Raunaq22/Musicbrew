const express = require('express');
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Simple admin check - in production, add proper role-based access
const isAdmin = async (req, res, next) => {
  // For now, check if user email contains 'admin' - replace with proper role system
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });
  
  if (user && (user.email.includes('admin') || user.username.includes('admin'))) {
    return next();
  }
  
  return res.status(403).json({ error: 'Admin access required' });
};

// Get all users (admin only)
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatar: true,
        isPublic: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            playlists: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get all reviews (admin only)
router.get('/reviews', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Delete a review (admin only)
router.delete('/reviews/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.review.delete({
      where: { id },
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Delete a comment (admin only)
router.delete('/comments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.comment.delete({
      where: { id },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Delete a user (admin only)
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot delete yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get statistics (admin only)
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalReviews,
      totalPlaylists,
      totalComments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.review.count(),
      prisma.playlist.count(),
      prisma.comment.count(),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalReviews,
        totalPlaylists,
        totalComments,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;

