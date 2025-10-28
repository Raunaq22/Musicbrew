import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Users, Star, Music, MessageCircle, Heart, UserPlus, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewCard from '../components/ReviewCard';

const UserProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('reviews');
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery(
    ['userProfile', username],
    () => api.get(`/users/${username}`).then(res => res.data),
    {
      enabled: !!username,
    }
  );

  // Fetch user's reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery(
    ['userReviews', username],
    () => api.get(`/reviews?userId=${profileData?.user?.id}`).then(res => res.data),
    {
      enabled: !!profileData?.user?.id,
    }
  );

  // Fetch user's playlists
  const { data: playlistsData, isLoading: playlistsLoading } = useQuery(
    ['userPlaylists', username],
    () => api.get(`/playlists?userId=${profileData?.user?.id}`).then(res => res.data),
    {
      enabled: !!profileData?.user?.id,
    }
  );

  // Follow/unfollow mutation
  const followMutation = useMutation(
    () => {
      if (profileData?.user?.isFollowing) {
        return api.delete(`/users/follow/${profileData.user.id}`).then(res => res.data);
      } else {
        return api.post(`/users/follow/${profileData.user.id}`).then(res => res.data);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userProfile', username]);
        toast.success(profileData?.user?.isFollowing ? 'Unfollowed successfully' : 'Following!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to follow/unfollow');
      },
    }
  );

  const user = profileData?.user;
  const reviews = reviewsData?.reviews || [];
  const playlists = playlistsData?.playlists || [];
  const isOwnProfile = currentUser && user && currentUser.id === user.id;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-text-muted mx-auto mb-4" />
        <p className="text-text-muted">User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-card rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName || user.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-text-muted" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-light mb-1">
                {user.displayName || user.username}
              </h1>
              <p className="text-text-muted mb-4">@{user.username}</p>

              {user.bio && (
                <p className="text-text-muted mb-4">{user.bio}</p>
              )}

              <div className="flex items-center space-x-6 text-sm text-text-muted">
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{user._count?.followers || 0} followers</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{user._count?.following || 0} following</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Star className="h-4 w-4" />
                  <span>{user._count?.reviews || 0} reviews</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Music className="h-4 w-4" />
                  <span>{user._count?.playlists || 0} playlists</span>
                </span>
              </div>
            </div>
          </div>

          {!isOwnProfile && currentUser && (
            <button
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isLoading}
              className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                user.isFollowing
                  ? 'bg-gray-700 hover:bg-gray-600 text-text-light'
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              {user.isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-card rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'reviews'
              ? 'bg-primary text-white'
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'playlists'
              ? 'bg-primary text-white'
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          Playlists ({playlists.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-lg">
              <Star className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No reviews yet</p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      )}

      {activeTab === 'playlists' && (
        <div className="space-y-4">
          {playlistsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-lg">
              <Music className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No playlists yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  to={`/playlists/${playlist.id}`}
                  className="bg-card rounded-lg p-4 hover:bg-gray-700 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-text-light mb-2">
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-text-muted text-sm mb-2">{playlist.description}</p>
                  )}
                  <p className="text-xs text-text-muted">
                    {new Date(playlist.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;

