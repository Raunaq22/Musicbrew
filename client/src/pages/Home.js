import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Music, Star, Users, TrendingUp } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          Welcome to <span className="text-green-400">MusicBrew</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Discover, rate, and share your favorite music with the community
        </p>
        
        {isAuthenticated ? (
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome back, {user?.displayName || user?.username}!
            </h2>
            <p className="text-gray-300">
              Ready to discover some amazing music?
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg text-gray-300">
              Connect with Spotify to start your musical journey
            </p>
            <a
              href="/login"
              className="inline-block bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Started
            </a>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <Music className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Discover Music</h3>
          <p className="text-gray-300">
            Search and explore millions of tracks, albums, and artists
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Rate & Review</h3>
          <p className="text-gray-300">
            Share your thoughts and rate your favorite music
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Connect</h3>
          <p className="text-gray-300">
            Follow friends and discover what they're listening to
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
          <p className="text-gray-300">
            Track your listening habits and discover your music taste
          </p>
        </div>
      </div>

      {/* Recent Activity Section (placeholder) */}
      {isAuthenticated && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="text-center py-8">
            <Music className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">
              Start rating and reviewing music to see your activity here
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
