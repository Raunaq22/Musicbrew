import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'react-query';
import { usePerformanceMonitor } from '../components/LazyComponent';
import { ResponsiveGrid, CardGrid } from '../components/ResponsiveGrid';
import { LoadingScreen, LoadingGrid } from '../components/LoadingSpinner';
import api from '../services/api';
import { Music, Star, Users, TrendingUp, Compass, BarChart3, Headphones } from 'lucide-react';
import ReviewCard from '../components/ReviewCard';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Performance monitoring
  usePerformanceMonitor('Home');

  // Fetch recent reviews from all users
  const { data: recentReviews, isLoading: reviewsLoading } = useQuery(
    ['recentReviews'],
    () => api.get('/reviews?limit=10&sortBy=createdAt&sortOrder=desc').then(res => res.data),
    {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Quick stats for authenticated users
  const { data: userStats } = useQuery(
    ['userStats', user?.id],
    () => api.get(`/analytics/user/${user.id}`).then(res => res.data.stats),
    {
      enabled: isAuthenticated && !!user?.id,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const featureCards = [
    {
      icon: Compass,
      title: 'Discover Music',
      description: 'Search and explore millions of tracks, albums, and artists',
      link: '/discovery',
      color: 'text-primary'
    },
    {
      icon: Star,
      title: 'Rate & Review',
      description: 'Share your thoughts and rate your favorite music',
      link: '/music/featured',
      color: 'text-accent'
    },
    {
      icon: Users,
      title: 'Connect',
      description: 'Follow friends and discover what they\'re listening to',
      link: '/profile',
      color: 'text-primary'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track your listening habits and discover your music taste',
      link: '/analytics',
      color: 'text-accent'
    }
  ];

  const quickActions = [
    {
      icon: Headphones,
      title: 'Join a Listening Room',
      description: 'Listen together with friends in real-time',
      link: '/listening-rooms',
      color: 'bg-green-500'
    },
    {
      icon: Music,
      title: 'Create Playlist',
      description: 'Build and share your perfect music collection',
      link: '/playlists',
      color: 'bg-blue-500'
    },
    {
      icon: TrendingUp,
      title: 'View Analytics',
      description: 'See your music insights and patterns',
      link: '/analytics',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-text-light mb-4">
          Welcome to <span className="text-primary">MusicBrew</span>
        </h1>
        <p className="text-lg md:text-xl text-text-muted mb-8 max-w-2xl mx-auto">
          Discover, rate, and share your favorite music with the community
        </p>
        
        {isAuthenticated ? (
          <CardGrid variant="featured" className="max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-semibold text-text-light mb-2">
              Welcome back, {user?.displayName || user?.username}!
            </h2>
            <p className="text-text-muted mb-4">
              Ready to discover some amazing music?
            </p>
            {userStats && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-600">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{userStats.totalReviews}</p>
                  <p className="text-xs text-text-muted">Reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">{userStats.followersCount}</p>
                  <p className="text-xs text-text-muted">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{userStats.averageRating}</p>
                  <p className="text-xs text-text-muted">Avg Rating</p>
                </div>
              </div>
            )}
          </CardGrid>
        ) : (
          <div className="space-y-4">
            <p className="text-lg text-text-muted">
              Connect with Spotify to start your musical journey
            </p>
            <a
              href="/login"
              className="inline-block bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Started
            </a>
          </div>
        )}
      </div>

      {/* Quick Actions for authenticated users */}
      {isAuthenticated && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-text-light mb-6 text-center">Quick Actions</h2>
          <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap={4}>
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.link} to={action.link}>
                  <CardGrid className="hover:bg-background transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-light group-hover:text-primary transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-text-muted text-sm">{action.description}</p>
                      </div>
                    </div>
                  </CardGrid>
                </Link>
              );
            })}
          </ResponsiveGrid>
        </div>
      )}

      {/* Features Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-text-light mb-6 text-center">Features</h2>
        <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap={6}>
          {featureCards.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Link key={feature.link} to={feature.link}>
                <CardGrid className="hover:bg-background transition-colors cursor-pointer group text-center">
                  <IconComponent className={`h-12 w-12 ${feature.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
                  <h3 className="text-xl font-semibold text-text-light mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-text-muted">
                    {feature.description}
                  </p>
                </CardGrid>
              </Link>
            );
          })}
        </ResponsiveGrid>
      </div>

      {/* Recent Activity Section */}
      {isAuthenticated && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-text-light">Recent Reviews</h2>
            <Link 
              to="/profile" 
              className="text-primary hover:text-primary-hover text-sm font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          
          <CardGrid>
            {reviewsLoading ? (
              <LoadingScreen message="Loading recent reviews..." />
            ) : recentReviews?.reviews?.length === 0 ? (
              <div className="text-center py-12">
                <Music className="h-16 w-16 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted mb-4">
                  No reviews yet. Start rating and reviewing music!
                </p>
                <Link 
                  to="/discovery" 
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Discover Music
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReviews?.reviews?.slice(0, 5).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </CardGrid>
        </div>
      )}

      {/* Call to Action for non-authenticated users */}
      {!isAuthenticated && (
        <div className="text-center py-12 bg-card rounded-lg">
          <h2 className="text-2xl font-semibold text-text-light mb-4">
            Join the MusicBrew Community
          </h2>
          <p className="text-text-muted mb-6 max-w-md mx-auto">
            Connect with fellow music lovers, discover new tracks, and share your passion for music.
          </p>
          <a
            href="/login"
            className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
          >
            Start Your Journey
          </a>
        </div>
      )}
    </div>
  );
};

export default Home;
