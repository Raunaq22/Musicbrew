import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { Users, Star, Trash2, BarChart3, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const queryClient = useQueryClient();

  // Fetch statistics
  const { data: statsData } = useQuery(
    ['adminStats'],
    () => api.get('/admin/stats').then(res => res.data),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch users
  const { data: usersData } = useQuery(
    ['adminUsers'],
    () => api.get('/admin/users').then(res => res.data),
    {
      enabled: activeTab === 'users',
    }
  );

  // Fetch reviews
  const { data: reviewsData } = useQuery(
    ['adminReviews'],
    () => api.get('/admin/reviews').then(res => res.data),
    {
      enabled: activeTab === 'reviews',
    }
  );

  // Delete mutations
  const deleteReviewMutation = useMutation(
    (reviewId) => api.delete(`/admin/reviews/${reviewId}`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminReviews']);
        queryClient.invalidateQueries(['reviews']);
        toast.success('Review deleted');
      },
    }
  );

  const deleteUserMutation = useMutation(
    (userId) => api.delete(`/admin/users/${userId}`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminUsers']);
        toast.success('User deleted');
      },
    }
  );

  const stats = statsData?.stats || {};
  const users = usersData?.users || [];
  const reviews = reviewsData?.reviews || [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-light mb-2">Admin Panel</h1>
        <p className="text-text-muted">Manage users, reviews, and content</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-card rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'stats'
              ? 'bg-primary text-white'
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Statistics</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'users'
              ? 'bg-primary text-white'
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Users</span>
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'reviews'
              ? 'bg-primary text-white'
              : 'text-text-muted hover:text-text-light'
          }`}
        >
          <Star className="h-4 w-4" />
          <span>Reviews</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg p-6">
            <Users className="h-8 w-8 text-primary mb-2" />
            <h3 className="text-2xl font-bold text-text-light">{stats.totalUsers || 0}</h3>
            <p className="text-text-muted">Total Users</p>
          </div>
          <div className="bg-card rounded-lg p-6">
            <Star className="h-8 w-8 text-accent mb-2" />
            <h3 className="text-2xl font-bold text-text-light">{stats.totalReviews || 0}</h3>
            <p className="text-text-muted">Total Reviews</p>
          </div>
          <div className="bg-card rounded-lg p-6">
            <BarChart3 className="h-8 w-8 text-primary mb-2" />
            <h3 className="text-2xl font-bold text-text-light">{stats.totalPlaylists || 0}</h3>
            <p className="text-text-muted">Total Playlists</p>
          </div>
          <div className="bg-card rounded-lg p-6">
            <AlertTriangle className="h-8 w-8 text-accent mb-2" />
            <h3 className="text-2xl font-bold text-text-light">{stats.totalComments || 0}</h3>
            <p className="text-text-muted">Total Comments</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-light mb-4">All Users</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-text-muted" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-text-light">{user.displayName || user.username}</p>
                    <p className="text-sm text-text-muted">@{user.username} • {user._count?.reviews || 0} reviews</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete user ${user.username}?`)) {
                      deleteUserMutation.mutate(user.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-light mb-4">All Reviews</h2>
          <div className="space-y-2">
            {reviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                <div className="flex-1">
                  <p className="font-medium text-text-light">
                    {review.user.displayName || review.user.username}
                  </p>
                  <p className="text-sm text-text-muted line-clamp-2">{review.content || 'No content'}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(review.createdAt).toLocaleDateString()} • 
                    {review._count?.likes || 0} likes • 
                    {review._count?.comments || 0} comments
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this review?')) {
                      deleteReviewMutation.mutate(review.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 transition-colors ml-4"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

