const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get reviews with optional filters
router.get('/', async (req, res) => {
  try {
    const { 
      musicId, 
      userId, 
      rating, 
      limit = 20, 
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {};
    
    if (musicId) where.musicId = musicId;
    if (userId) where.userId = userId;
    if (rating) where.rating = parseInt(rating);

    const reviews = await prisma.review.findMany({
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Create a new review
router.post('/', 
  authenticateToken,
  [
    body('musicId').notEmpty().withMessage('Music ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('content').optional().isString().isLength({ max: 2000 }).withMessage('Content must be less than 2000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { musicId, rating, content } = req.body;

      // Check if user already reviewed this music
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_musicId: {
            userId: req.user.id,
            musicId: musicId,
          },
        },
      });

      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this music' });
      }

      const review = await prisma.review.create({
        data: {
          userId: req.user.id,
          musicId,
          rating,
          content,
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      res.status(201).json({ review });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  }
);

// Get a specific review
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
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
        comments: {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Fetch music details from Spotify API
    let musicData = null;
    try {
      const { accesstoken } = req.headers;
      if (accesstoken) {
        const spotifyService = require('../services/spotify');
        const deezerService = require('../services/deezer');
        
        // Get track details from Spotify
        const track = await spotifyService.getTrack(review.musicId, accesstoken);
        
        // Add Deezer preview URL for the track
        const trackWithPreview = await deezerService.getPreviewForSpotifyTrack(track);
        
        musicData = {
          id: trackWithPreview.id,
          name: trackWithPreview.name,
          artists: trackWithPreview.artists,
          album: trackWithPreview.album,
          images: trackWithPreview.album?.images || [],
          preview_url: trackWithPreview.preview_url,
        };
      } else {
        // Fallback for demo data - create basic music info from musicId
        musicData = {
          id: review.musicId,
          name: `Track ${review.musicId.substring(0, 8)}`,
          artists: [{ name: 'Unknown Artist' }],
          album: { name: 'Unknown Album' },
          images: [],
          preview_url: null,
        };
      }
    } catch (error) {
      console.error('Failed to fetch music data:', error);
      // Fallback for demo data
      musicData = {
        id: review.musicId,
        name: `Track ${review.musicId.substring(0, 8)}`,
        artists: [{ name: 'Unknown Artist' }],
        album: { name: 'Unknown Album' },
        images: [],
        preview_url: null,
      };
    }

    res.json({ 
      review: {
        ...review,
        music: musicData
      }
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Failed to get review' });
  }
});

// Update a review
router.put('/:id', 
  authenticateToken,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('content').optional().isString().isLength({ max: 2000 }).withMessage('Content must be less than 2000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { rating, content } = req.body;

      // Check if review exists and belongs to user
      const existingReview = await prisma.review.findUnique({
        where: { id },
      });

      if (!existingReview) {
        return res.status(404).json({ error: 'Review not found' });
      }

      if (existingReview.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this review' });
      }

      const review = await prisma.review.update({
        where: { id },
        data: {
          rating,
          content,
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      res.json({ review });
    } catch (error) {
      console.error('Update review error:', error);
      res.status(500).json({ error: 'Failed to update review' });
    }
  }
);

// Delete a review
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await prisma.review.delete({
      where: { id },
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Like/unlike a review
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user already liked this review
    const existingLike = await prisma.like.findUnique({
      where: {
        reviewId_userId: {
          reviewId: id,
          userId: req.user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike the review
      await prisma.like.delete({
        where: {
          reviewId_userId: {
            reviewId: id,
            userId: req.user.id,
          },
        },
      });
      res.json({ message: 'Review unliked', liked: false });
    } else {
      // Like the review
      await prisma.like.create({
        data: {
          reviewId: id,
          userId: req.user.id,
        },
      });
      res.json({ message: 'Review liked', liked: true });
    }
  } catch (error) {
    console.error('Like review error:', error);
    res.status(500).json({ error: 'Failed to like/unlike review' });
  }
});

// Get friends' reviews
router.get('/friends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Get users that the current user is following
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return res.json({ reviews: [] });
    }

    const reviews = await prisma.review.findMany({
      where: {
        userId: { in: followingIds },
        user: {
          isPublic: true,
        },
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
        music: {
          select: {
            id: true,
            name: true,
            artists: true,
            album: true,
            images: true,
          },
        },
        comments: {
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
          orderBy: { createdAt: 'asc' },
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
    console.error('Get friends reviews error:', error);
    res.status(500).json({ error: 'Failed to get friends reviews' });
  }
});

// Get comments for a review
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const comments = await prisma.comment.findMany({
      where: { reviewId: id },
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
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// Add a comment to a review
router.post('/:id/comment', 
  authenticateToken,
  [
    body('content').notEmpty().withMessage('Content is required').isLength({ max: 500 }).withMessage('Content must be less than 500 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { content } = req.body;

      // Check if review exists
      const review = await prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      const comment = await prisma.comment.create({
        data: {
          reviewId: id,
          userId: req.user.id,
          content,
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

      res.json({ comment });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
);

// Delete a comment
router.delete('/:reviewId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { reviewId, commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
