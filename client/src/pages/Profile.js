import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { User, Edit3, Save, X, Star, MessageCircle, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    isPublic: user?.isPublic ?? true,
  });

  const queryClient = useQueryClient();

  // Fetch user's reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery(
    ['userReviews', user?.id],
    () => api.get(`/reviews?userId=${user?.id}`).then(res => res.data),
    {
      enabled: !!user?.id,
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data) => api.put('/auth/me', data).then(res => res.data),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['user'], data);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error('Failed to update profile');
      },
    }
  );

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      isPublic: user?.isPublic ?? true,
    });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const reviews = reviewsData?.reviews || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-6">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.displayName || user.username}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
          )}

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Tell us about your music taste..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-400 focus:ring-green-400 border-gray-600 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-300">
                    Public profile
                  </label>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isLoading}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {user?.displayName || user?.username}
                    </h1>
                    <p className="text-gray-400">@{user?.username}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {user?.bio && (
                  <p className="text-gray-300 mb-4">{user.bio}</p>
                )}

                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <span>Member since {new Date(user?.createdAt).toLocaleDateString()}</span>
                  <span>{user?.isPublic ? 'Public' : 'Private'} profile</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">My Reviews</h2>
        
        {reviewsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">You haven't reviewed any music yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Start by searching for music and adding your first review
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-500'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {review.content && (
                      <p className="text-gray-300 mb-2">{review.content}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{review._count?.likes || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{review._count?.comments || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
