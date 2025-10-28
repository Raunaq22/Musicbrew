import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'react-query';
import api from '../services/api';
import { Music, Star, Users, TrendingUp } from 'lucide-react';
import ReviewCard from '../components/ReviewCard';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  // Fetch recent reviews from all users (or from followed users when implemented)
  const { data: recentReviews, isLoading: reviewsLoading } = useQuery(
    ['recentReviews'],
    () => api.get('/reviews?limit=10&sortBy=createdAt&sortOrder=desc').then(res => res.data),
    {
      enabled: isAuthenticated,
    }
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-text-light mb-4">
          Welcome to <span className="text-primary">MusicBrew</span>
        </h1>
        <p className="text-xl text-text-muted mb-8">
          Discover, rate, and share your favorite music with the community
        </p>
        
        {isAuthenticated ? (
          <div className="bg-card rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-text-light mb-2">
              Welcome back, {user?.displayName || user?.username}!
            </h2>
            <p className="text-text-muted">
              Ready to discover some amazing music?
            </p>
          </div>
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

      {/* Features Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-card rounded-lg p-6 text-center">
          <Music className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-light mb-2">Discover Music</h3>
          <p className="text-text-muted">
            Search and explore millions of tracks, albums, and artists
          </p>
        </div>

        <div className="bg-card rounded-lg p-6 text-center">
          <Star className="h-12 w-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-light mb-2">Rate & Review</h3>
          <p className="text-text-muted">
            Share your thoughts and rate your favorite music
          </p>
        </div>

        <div className="bg-card rounded-lg p-6 text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-light mb-2">Connect</h3>
          <p className="text-text-muted">
            Follow friends and discover what they're listening to
          </p>
        </div>

        <div className="bg-card rounded-lg p-6 text-center">
          <TrendingUp className="h-12 w-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-light mb-2">Analytics</h3>
          <p className="text-text-muted">
            Track your listening habits and discover your music taste
          </p>
        </div>
      </div>

      {/* Recent Activity Section */}
      {isAuthenticated && (
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-text-light mb-4">Recent Reviews</h2>
          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : recentReviews?.reviews?.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">
                No reviews yet. Start rating and reviewing music!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReviews?.reviews?.slice(0, 5).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
