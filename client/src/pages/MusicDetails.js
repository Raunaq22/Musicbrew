import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Star, Play, Music, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewCard from '../components/ReviewCard';

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
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to submit review');
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

  const reviews = reviewsData?.reviews || [];

  if (trackLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="text-center py-12">
        <Music className="h-16 w-16 text-text-muted mx-auto mb-4" />
        <p className="text-text-muted">Track not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Track Header */}
      <div className="bg-card rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-6">
          {track.album?.images?.[0] && (
            <img
              src={track.album.images[0].url}
              alt={track.name}
              className="w-32 h-32 rounded-lg object-cover"
            />
          )}
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">{track.name}</h1>
            <p className="text-xl text-text-muted mb-2">
              {track.artists?.map(artist => artist.name).join(', ')}
            </p>
            {track.album && (
              <p className="text-text-muted mb-4">{track.album.name}</p>
            )}
            
            <div className="flex items-center space-x-4">
              <a 
                href={track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Open on Spotify</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      <div className="bg-card rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Write a Review</h2>
        
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
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
                      star <= rating ? 'text-accent fill-current' : 'text-text-muted'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Review (optional)
            </label>
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Share your thoughts about this track..."
            />
          </div>

          <button
            type="submit"
            disabled={submitReviewMutation.isLoading || rating === 0}
            className="bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
          >
            {submitReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Reviews ({reviews.length})
        </h2>
        
        {reviewsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-16 w-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No reviews yet</p>
            <p className="text-sm text-text-muted mt-2">
              Be the first to review this track!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicDetails;
