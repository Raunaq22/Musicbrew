import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Music, TrendingUp, Star, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const Discovery = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [weeklyPicks, setWeeklyPicks] = useState([]);
  const [trendingMusic, setTrendingMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('for-you');
  const [similarUsers, setSimilarUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadDiscoveryData();
  }, [activeTab]);

  const loadDiscoveryData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'for-you':
          await loadPersonalizedRecommendations();
          break;
        case 'trending':
          await loadTrending();
          break;
        case 'weekly':
          await loadWeeklyPicks();
          break;
        case 'similar':
          await loadSimilarUsers();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading discovery data:', error);
      toast.error('Failed to load discovery data');
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalizedRecommendations = async () => {
    try {
      const response = await api.get('/discovery/recommendations');
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadTrending = async () => {
    try {
      const response = await api.get('/analytics/trends');
      setTrendingMusic(response.data.trending || []);
    } catch (error) {
      console.error('Error loading trending:', error);
    }
  };

  const loadWeeklyPicks = async () => {
    try {
      const response = await api.get('/discovery/weekly-picks');
      setWeeklyPicks(response.data.picks || []);
    } catch (error) {
      console.error('Error loading weekly picks:', error);
    }
  };

  const loadSimilarUsers = async () => {
    // This would typically load a list of users with similar taste
    // For now, we'll show some placeholder data
    setSimilarUsers([
      { id: '1', username: 'musiclover123', similarity: 85 },
      { id: '2', username: 'indiehead', similarity: 78 },
      { id: '3', username: 'vinylcollector', similarity: 72 }
    ]);
  };

  const checkUserSimilarity = async (otherUserId) => {
    try {
      const response = await api.get(`/discovery/similarity/${otherUserId}`);
      setSelectedUser({
        id: otherUserId,
        ...response.data
      });
    } catch (error) {
      toast.error('Failed to check similarity');
    }
  };

  const renderForYou = () => (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Personalized for You</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No personalized recommendations yet.</p>
            <p className="text-muted-foreground text-sm mt-2">Start reviewing music to get better recommendations!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((musicId, index) => (
              <div key={`${musicId}-${index}`} className="bg-background rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Music ID: {musicId}</p>
                    <p className="text-muted-foreground text-sm">Recommended based on your taste</p>
                  </div>
                </div>
                <button className="w-full mt-3 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTrending = () => (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Trending This Month</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : trendingMusic.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No trending data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trendingMusic.map((music, index) => (
              <div key={music.musicId} className="flex items-center space-x-4 p-4 bg-background rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-medium">Music ID: {music.musicId}</p>
                  <p className="text-muted-foreground text-sm">
                    {music._count.id} reviews • {Math.round(music._avg.rating * 10) / 10} avg rating
                  </p>
                </div>
                <button className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm">
                  Listen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderWeekly = () => (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Weekly Editor's Picks</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : weeklyPicks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No weekly picks available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyPicks.map((pick, index) => (
              <div key={pick.id} className="bg-background rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Music ID: {pick.musicId}</p>
                    <p className="text-muted-foreground text-sm">
                      Rating: {pick.rating}★ by {pick.user?.displayName || pick.user?.username}
                    </p>
                  </div>
                </div>
                {pick.content && (
                  <p className="text-muted-foreground text-sm mt-3 line-clamp-2">{pick.content}</p>
                )}
                <button className="w-full mt-3 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSimilar = () => (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Users with Similar Taste</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {similarUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">@{user.username}</p>
                    <p className="text-muted-foreground text-sm">{user.similarity}% taste similarity</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    user.similarity >= 80 ? 'bg-green-500' :
                    user.similarity >= 60 ? 'bg-yellow-500' :
                    'bg-orange-500'
                  }`} />
                  <button
                    onClick={() => checkUserSimilarity(user.id)}
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Compare
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="bg-card rounded-lg p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">
            Similarity with User {selectedUser.id}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{selectedUser.similarity}%</p>
              <p className="text-muted-foreground">Similarity Score</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{selectedUser.totalCommonMusic}</p>
              <p className="text-muted-foreground">Common Music</p>
            </div>
          </div>
          {selectedUser.analysis && (
            <div className="mt-4 p-4 bg-background rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Analysis</h4>
              <p className="text-muted-foreground text-sm">
                {selectedUser.analysis.verySimilar ? 'Your music tastes are very similar!' :
                 selectedUser.analysis.similar ? 'You have similar music preferences.' :
                 selectedUser.analysis.somewhatSimilar ? 'You share some musical interests.' :
                 'You have different music preferences.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Discover Music</h1>
        <p className="text-muted-foreground">Find new music based on your taste and what's trending</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-card rounded-lg p-1 mb-8">
        {[
          { id: 'for-you', label: 'For You', icon: Music },
          { id: 'trending', label: 'Trending', icon: TrendingUp },
          { id: 'weekly', label: "Editor's Picks", icon: Star },
          { id: 'similar', label: 'Similar Users', icon: Users }
        ].map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'for-you' && renderForYou()}
      {activeTab === 'trending' && renderTrending()}
      {activeTab === 'weekly' && renderWeekly()}
      {activeTab === 'similar' && renderSimilar()}
    </div>
  );
};

export default Discovery;