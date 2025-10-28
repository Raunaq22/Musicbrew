const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get personalized recommendations based on user activity
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's recent reviews to understand preferences
    const userReviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    if (userReviews.length === 0) {
      // For new users, return trending music
      return getTrendingRecommendations(req, res);
    }

    // Analyze user's rating preferences
    const highRatedReviews = userReviews.filter(review => review.rating >= 4);
    const musicIdsFromHighRatings = highRatedReviews.map(review => review.musicId);

    // Get similar music based on collaborative filtering
    // Find other users who also rated these tracks highly
    const similarUserReviews = await prisma.review.findMany({
      where: {
        musicId: { in: musicIdsFromHighRatings },
        userId: { not: userId },
        rating: { gte: 4 }
      },
      include: {
        user: {
          select: {
            id: true,
            reviews: {
              where: { rating: { gte: 4 } }
            }
          }
        }
      },
      take: 100
    });

    // Extract music IDs that similar users liked
    const recommendedMusicIds = new Set();
    similarUserReviews.forEach(review => {
      review.user.reviews.forEach(userReview => {
        if (userReview.rating >= 4 && !musicIdsFromHighRatings.includes(userReview.musicId)) {
          recommendedMusicIds.add(userReview.musicId);
        }
      });
    });

    // Get recommendations (limit to avoid overwhelming the user)
    const recommendations = Array.from(recommendedMusicIds).slice(0, 20);

    res.json({
      recommendations,
      algorithm: 'collaborative_filtering',
      basedOnReviews: userReviews.length,
      confidence: userReviews.length > 10 ? 'high' : 'medium'
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Get trending music for new users
async function getTrendingRecommendations(req, res) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingReviews = await prisma.review.groupBy({
      by: ['musicId'],
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: {
        id: true
      },
      _avg: {
        rating: true
      },
      orderBy: [
        { _count: { id: 'desc' } },
        { _avg: { rating: 'desc' } }
      ],
      take: 20
    });

    const trendingIds = trendingReviews.map(review => review.musicId);

    res.json({
      recommendations: trendingIds,
      algorithm: 'trending',
      period: 'last_30_days'
    });
  } catch (error) {
    console.error('Error fetching trending recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch trending recommendations' });
  }
}

// Get music discovery by genre
router.get('/by-genre', authenticateToken, async (req, res) => {
  try {
    const { genre } = req.query;
    
    if (!genre) {
      return res.status(400).json({ error: 'Genre parameter required' });
    }

    // This would typically integrate with Spotify's genre-based recommendations
    // For now, we'll return popular tracks that users have reviewed
    const genreReviews = await prisma.review.findMany({
      where: {
        rating: { gte: 4 }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      include: {
        user: {
          select: {
            username: true,
            displayName: true
          }
        }
      }
    });

    // In a real implementation, you'd filter by genre using Spotify's API
    res.json({
      genre,
      music: genreReviews.slice(0, 20),
      totalFound: genreReviews.length
    });
  } catch (error) {
    console.error('Error fetching genre recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch genre recommendations' });
  }
});

// Get "Because you liked..." recommendations
router.get('/because-you-liked/:musicId', authenticateToken, async (req, res) => {
  try {
    const { musicId } = req.params;
    const userId = req.user.id;

    // Find users who also liked this music
    const similarTasteUsers = await prisma.review.findMany({
      where: {
        musicId,
        rating: { gte: 4 },
        userId: { not: userId }
      },
      select: {
        userId: true
      },
      take: 10
    });

    const userIds = similarTasteUsers.map(user => user.userId);

    if (userIds.length === 0) {
      return res.json({ recommendations: [], message: 'No similar taste users found' });
    }

    // Get music these users also liked
    const theirLikedMusic = await prisma.review.findMany({
      where: {
        userId: { in: userIds },
        rating: { gte: 4 },
        musicId: { not: musicId }
      },
      select: {
        musicId: true
      }
    });

    // Count frequency and get top recommendations
    const musicCount = {};
    theirLikedMusic.forEach(review => {
      musicCount[review.musicId] = (musicCount[review.musicId] || 0) + 1;
    });

    const topRecommendations = Object.entries(musicCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([musicId, count]) => ({ musicId, frequency: count }));

    res.json({
      sourceMusicId: musicId,
      recommendations: topRecommendations,
      basedOnUsers: userIds.length
    });
  } catch (error) {
    console.error('Error fetching because-you-liked recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch because-you-liked recommendations' });
  }
});

// Get weekly discovery picks (editorial recommendations)
router.get('/weekly-picks', authenticateToken, async (req, res) => {
  try {
    // Get the highest rated music from the past week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyPicks = await prisma.review.findMany({
      where: {
        createdAt: { gte: weekAgo },
        rating: { gte: 4 }
      },
      orderBy: {
        rating: 'desc'
      },
      distinct: ['musicId'],
      take: 15,
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
      period: 'last_week',
      picks: weeklyPicks,
      totalPicks: weeklyPicks.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching weekly picks:', error);
    res.status(500).json({ error: 'Failed to fetch weekly picks' });
  }
});

// Get user similarity with another user
router.get('/similarity/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.user.id;

    if (otherUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot compare user with themselves' });
    }

    // Get reviews from both users
    const currentUserReviews = await prisma.review.findMany({
      where: { userId: currentUserId }
    });

    const otherUserReviews = await prisma.review.findMany({
      where: { userId: otherUserId }
    });

    if (currentUserReviews.length === 0 || otherUserReviews.length === 0) {
      return res.json({ 
        similarity: 0, 
        commonReviews: [],
        message: 'Insufficient data for comparison' 
      });
    }

    // Find common music both users have reviewed
    const currentUserMusicIds = new Set(currentUserReviews.map(r => r.musicId));
    const commonMusic = otherUserReviews.filter(review => 
      currentUserMusicIds.has(review.musicId)
    );

    if (commonMusic.length === 0) {
      return res.json({ 
        similarity: 0, 
        commonReviews: [],
        message: 'No common music found' 
      });
    }

    // Calculate similarity score (0-100)
    let totalDifference = 0;
    const commonReviews = [];

    for (const otherReview of commonMusic) {
      const currentReview = currentUserReviews.find(
        r => r.musicId === otherReview.musicId
      );
      
      if (currentReview) {
        const difference = Math.abs(currentReview.rating - otherReview.rating);
        totalDifference += difference;
        commonReviews.push({
          musicId: otherReview.musicId,
          currentUserRating: currentReview.rating,
          otherUserRating: otherReview.rating,
          difference
        });
      }
    }

    const averageDifference = totalDifference / commonReviews.length;
    const similarity = Math.max(0, 100 - (averageDifference * 25)); // Convert to 0-100 scale

    res.json({
      similarity: Math.round(similarity),
      commonReviews,
      totalCommonMusic: commonMusic.length,
      analysis: {
        verySimilar: similarity >= 80,
        similar: similarity >= 60,
        somewhatSimilar: similarity >= 40
      }
    });
  } catch (error) {
    console.error('Error calculating user similarity:', error);
    res.status(500).json({ error: 'Failed to calculate user similarity' });
  }
});

module.exports = router;