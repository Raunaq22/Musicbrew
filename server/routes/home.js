const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get data for home page sections
router.get('/home', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's following
    const following = await getPrisma().follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    
    const followingIds = following.map(f => f.followingId);
    const allUserIds = [userId, ...followingIds];

    // Popular This Week - tracks with most recent reviews
    const popularThisWeek = await getPrisma().review.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // New From Friends - reviews from users being followed
    const newFromFriends = followingIds.length > 0 ? await getPrisma().review.findMany({
      where: {
        userId: {
          in: followingIds
        },
        createdAt: {
          gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Last 3 days
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 12
    }) : [];

    // Popular With Friends - most reviewed tracks by followed users
    const popularWithFriends = followingIds.length > 0 ? await getPrisma().review.groupBy({
      by: ['musicId'],
      where: {
        userId: {
          in: followingIds
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 12
    }) : [];

    // Get user details for popular with friends
    const popularWithFriendsDetails = await Promise.all(
      popularWithFriends.map(async (item) => {
        const reviews = await getPrisma().review.findMany({
          where: {
            musicId: item.musicId,
            userId: {
              in: followingIds
            }
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        });

        return {
          musicId: item.musicId,
          reviewCount: item._count.id,
          latestReview: reviews[0] || null
        };
      })
    );

    res.json({
      popularThisWeek: popularThisWeek.map(review => ({
        id: review.musicId,
        name: `Track ${review.musicId.substring(0, 8)}`, // Generate name from ID for demo
        artist: review.user.displayName || review.user.username,
        artwork: review.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user.username}`,
        review: {
          rating: review.rating,
          content: review.content,
          createdAt: review.createdAt
        },
        reviewer: review.user
      })),
      newFromFriends: newFromFriends.map(review => ({
        id: review.musicId,
        name: `Track ${review.musicId.substring(0, 8)}`,
        artist: review.user.displayName || review.user.username,
        artwork: review.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user.username}`,
        review: {
          rating: review.rating,
          content: review.content,
          createdAt: review.createdAt
        },
        friend: review.user
      })),
      popularWithFriends: popularWithFriendsDetails.map(item => ({
        id: item.musicId,
        name: `Track ${item.musicId.substring(0, 8)}`,
        artist: item.latestReview?.user.displayName || item.latestReview?.user.username || 'Unknown Artist',
        artwork: item.latestReview?.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.latestReview?.user.username || 'user'}`,
        plays: item.reviewCount,
        latestReview: item.latestReview
      }))
    });

  } catch (error) {
    console.error('Error fetching home data:', error);
    res.status(500).json({ error: 'Failed to fetch home data' });
  }
});

// Get trending playlists for home page
router.get('/home/trending-playlists', authenticateToken, async (req, res) => {
  try {
    const trendingPlaylists = await getPrisma().playlist.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 12
    });

    res.json({
      playlists: trendingPlaylists.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        coverImage: playlist.coverImage || `https://picsum.photos/300/300?random=${playlist.id.charCodeAt(0)}`,
        creator: playlist.user,
        trackCount: 0, // Would need to count tracks in a real implementation
        isPublic: playlist.isPublic,
        createdAt: playlist.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching trending playlists:', error);
    res.status(500).json({ error: 'Failed to fetch trending playlists' });
  }
});

module.exports = router;