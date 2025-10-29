const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user statistics
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get basic user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get review statistics
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            username: true,
            displayName: true
          }
        }
      }
    });

    // Calculate rating distribution
    const ratingDistribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {});

    // Get playlists count
    const playlistsCount = await prisma.playlist.count({
      where: { userId }
    });

    // Get followers and following counts
    const followersCount = await prisma.follow.count({
      where: { followingId: userId }
    });

    const followingCount = await prisma.follow.count({
      where: { followerId: userId }
    });

    // Get total likes received
    const likesReceived = await prisma.like.count({
      where: {
        review: {
          userId: userId
        }
      }
    });

    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    // Get activity over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReviews = await prisma.review.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const activityData = {};
    recentReviews.forEach(review => {
      const date = review.createdAt.toISOString().split('T')[0];
      activityData[date] = (activityData[date] || 0) + 1;
    });

    res.json({
      user,
      stats: {
        totalReviews: reviews.length,
        totalPlaylists: playlistsCount,
        followersCount,
        followingCount,
        likesReceived,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        activityData,
        memberSince: user.createdAt
      },
      recentActivity: recentReviews.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Get global app statistics (admin only)
router.get('/global', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get total counts
    const totalUsers = await prisma.user.count();
    const totalReviews = await prisma.review.count();
    const totalPlaylists = await prisma.playlist.count();

    // Get active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          {
            reviews: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo
                }
              }
            }
          },
          {
            listeningRooms: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo
                }
              }
            }
          }
        ]
      }
    });

    // Get recent activity
    const recentReviews = await prisma.review.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            displayName: true
          }
        }
      }
    });

    res.json({
      totalUsers,
      totalReviews,
      totalPlaylists,
      activeUsers,
      recentReviews
    });
  } catch (error) {
    console.error('Error fetching global analytics:', error);
    res.status(500).json({ error: 'Failed to fetch global analytics' });
  }
});

// Get music trends
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    // Get trending music based on recent reviews and ratings
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingMusic = await prisma.review.groupBy({
      by: ['musicId'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        id: true
      },
      _avg: {
        rating: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 20
    });

    res.json({
      trending: trendingMusic,
      period: 'last_30_days'
    });
  } catch (error) {
    console.error('Error fetching music trends:', error);
    res.status(500).json({ error: 'Failed to fetch music trends' });
  }
});

// Get user listening patterns
router.get('/patterns/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    if (reviews.length === 0) {
      return res.json({ patterns: [], message: 'No listening data available' });
    }

    // Analyze listening patterns by day of week and hour
    const patterns = {
      byDayOfWeek: {},
      byHour: {},
      monthlyActivity: {}
    };

    reviews.forEach(review => {
      const date = new Date(review.createdAt);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      const monthYear = date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit' });

      patterns.byDayOfWeek[dayOfWeek] = (patterns.byDayOfWeek[dayOfWeek] || 0) + 1;
      patterns.byHour[hour] = (patterns.byHour[hour] || 0) + 1;
      patterns.monthlyActivity[monthYear] = (patterns.monthlyActivity[monthYear] || 0) + 1;
    });

    res.json({
      patterns,
      totalListens: reviews.length,
      dataPoints: reviews.length
    });
  } catch (error) {
    console.error('Error fetching listening patterns:', error);
    res.status(500).json({ error: 'Failed to fetch listening patterns' });
  }
});

module.exports = router;