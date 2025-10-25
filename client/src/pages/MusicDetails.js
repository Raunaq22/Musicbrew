import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Star, Heart, MessageCircle, Play, Pause, Music } from 'lucide-react';
import toast from 'react-hot-toast';

const MusicDetails = () => {
  const { id } = useParams();
  const { user, spotifyToken } = useAuth();
  const [rating, setRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  // Fetch track details
  const { data: track, isLoading: trackLoading } = useQuery(
    ['track', id],
    () => api.get(`/music/track/${id}`).then(res => res.data),
    {
      enabled: !!id && !!spotifyToken,
    }
  );

  // Fetch reviews for this track
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery(
    ['reviews', id],
    () => api.get(`/reviews?musicId=${id}`).then(res => res.data),
    {
      enabled: !!id,
    }
  );

  // Submit review mutation
  const submitReviewMutation = useMutation(
    (data) => api.post('/reviews', data).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews', id]);
        setRating(0);
        setReviewContent('');
        toast.success('Review submitted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to submit review');
      },
    }
  );

  // Like/unlike review mutation
  const likeReviewMutation = useMutation(
    (reviewId) => api.post(`/reviews/${reviewId}/like`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews', id]);
      },
    }
  );

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    submitReviewMutation.mutate({
      musicId: id,
      rating,
      content: reviewContent,
    });
  };

  const handleLikeReview = (reviewId) => {
    likeReviewMutation.mutate(reviewId);
  };

  const reviews = reviewsData?.reviews || [];

  if (trackLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="text-center py-12">
        <Music className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Track not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Track Header */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-6">
          {track.album?.images?.[0] && (
            <img
              src={track.album.images[0].url}
              alt={track.name}
              className="w-32 h-32 rounded-lg object-cover"
            />
          )}
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{track.name}</h1>
            <p className="text-xl text-gray-300 mb-2">
              {track.artists?.map(artist => artist.name).join(', ')}
            </p>
            {track.album && (
              <p className="text-gray-400 mb-4">{track.album.name}</p>
            )}
            
            <div className="flex items-center space-x-4">
              <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2">
                <Play className="h-4 w-4" />
                <span>Play on Spotify</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Write a Review</h2>
        
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-500'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Review (optional)
            </label>
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Share your thoughts about this track..."
            />
          </div>

          <button
            type="submit"
            disabled={submitReviewMutation.isLoading || rating === 0}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
          >
            {submitReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Reviews ({reviews.length})
        </h2>
        
        {reviewsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No reviews yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Be the first to review this track!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {review.user.avatar ? (
                      <img
                        src={review.user.avatar}
                        alt={review.user.displayName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-300">
                          {review.user.displayName?.[0] || review.user.username?.[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">
                        {review.user.displayName || review.user.username}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
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
                </div>
                
                {review.content && (
                  <p className="text-gray-300 mb-3">{review.content}</p>
                )}
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLikeReview(review.id)}
                    className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    <span>{review._count?.likes || 0}</span>
                  </button>
                  
                  <span className="flex items-center space-x-1 text-gray-400">
                    <MessageCircle className="h-4 w-4" />
                    <span>{review._count?.comments || 0}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicDetails;
