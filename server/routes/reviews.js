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

    res.json({ review });
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

module.exports = router;
