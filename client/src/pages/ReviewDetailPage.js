import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { Star, Heart, MessageCircle, Edit3, Trash2, Send, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ReviewDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    content: '',
  });
  const [commentContent, setCommentContent] = useState('');
  const queryClient = useQueryClient();

  // Fetch review data
  const { data: reviewData, isLoading: reviewLoading } = useQuery(
    ['review', id],
    () => api.get(`/reviews/${id}`).then(res => res.data),
    {
      enabled: !!id,
    }
  );

  const review = reviewData?.review || null;
  const isOwner = review?.userId === user?.id;

  // Initialize form data when review is loaded
  React.useEffect(() => {
    if (review) {
      setFormData({
        rating: review.rating,
        content: review.content || '',
      });
    }
  }, [review]);

  // Edit review mutation
  const editReviewMutation = useMutation(
    (data) => api.put(`/reviews/${id}`, data).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['review', id]);
        queryClient.invalidateQueries(['reviews']);
        queryClient.invalidateQueries(['userReviews']);
        queryClient.invalidateQueries(['friendsReviews']);
        setIsEditing(false);
        toast.success('Review updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update review');
      },
    }
  );

  // Delete review mutation
  const deleteReviewMutation = useMutation(
    () => api.delete(`/reviews/${id}`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews']);
        queryClient.invalidateQueries(['userReviews']);
        queryClient.invalidateQueries(['friendsReviews']);
        toast.success('Review deleted successfully');
        // Redirect back to reviews page
        window.history.back();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete review');
      },
    }
  );

  // Like/unlike mutation
  const likeMutation = useMutation(
    () => api.post(`/reviews/${id}/like`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['review', id]);
        queryClient.invalidateQueries(['reviews']);
        queryClient.invalidateQueries(['userReviews']);
        queryClient.invalidateQueries(['friendsReviews']);
      },
    }
  );

  // Add comment mutation
  const addCommentMutation = useMutation(
    (content) => api.post(`/reviews/${id}/comment`, { content }).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['review', id]);
        queryClient.invalidateQueries(['reviews']);
        queryClient.invalidateQueries(['userReviews']);
        queryClient.invalidateQueries(['friendsReviews']);
        setCommentContent('');
        toast.success('Comment added successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to add comment');
      },
    }
  );

  // Delete comment mutation
  const deleteCommentMutation = useMutation(
    (commentId) => api.delete(`/reviews/${id}/comments/${commentId}`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['review', id]);
        queryClient.invalidateQueries(['reviews']);
        queryClient.invalidateQueries(['userReviews']);
        queryClient.invalidateQueries(['friendsReviews']);
        toast.success('Comment deleted successfully');
      },
    }
  );

const handleSave = () => {
     if (!formData.content.trim()) {
       toast.error('Review content cannot be empty');
       return;
     }
     editReviewMutation.mutate({
       ...formData,
       rating: parseInt(formData.rating, 10)
     });
   };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReviewMutation.mutate();
    }
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    addCommentMutation.mutate(commentContent);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (reviewLoading || !review) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-card rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/reviews"
          className="flex items-center space-x-2 text-text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Reviews</span>
        </Link>
      </div>

      <div className="bg-card rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {isOwner ? 'My Review' : `${review.user.displayName || review.user.username}'s Review`}
          </h1>
        </div>

        <div className="space-y-6">
          {/* Music Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <img
                src={review.music?.images?.[0]?.url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" fill="%23374151"/><path d="M20 44V20l24-6v24" stroke="%239CA3AF" stroke-width="2" fill="none"/><circle cx="44" cy="24" r="4" fill="%239CA3AF"/></svg>'}
                alt={review.music?.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {review.music?.name}
                </h3>
                <p className="text-text-muted">
                  {review.music?.artists?.[0]?.name || review.music?.artist?.name || 'Unknown Artist'}
                </p>
                {review.music?.album?.name && (
                  <p className="text-text-muted text-sm">
                    from "{review.music.album.name}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Review Content */}
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              {review.user.avatar ? (
                <img
                  src={review.user.avatar}
                  alt={review.user.displayName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm text-foreground">
                    {review.user.displayName?.[0] || review.user.username?.[0]}
                  </span>
                </div>
              )}
              <div>
                <div className="font-medium text-foreground">
                  {review.user.displayName || review.user.username}
                </div>
                <div className="text-sm text-text-muted">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

{/* Rating */}
             <div className="flex items-center space-x-2">
               <div className="flex">
                 {[...Array(5)].map((_, i) => (
                   <Star
                     key={i}
                     className={`h-5 w-5 ${
                       i < review.rating ? 'text-yellow-400 fill-current' : 'text-text-muted'
                     }`}
                   />
                 ))}
               </div>
               {isOwner && (
                 <button
                   onClick={() => setIsEditing(!isEditing)}
                   className="text-text-muted hover:text-primary transition-colors"
                 >
                   <Edit3 className="h-4 w-4" />
                 </button>
               )}
             </div>

            {/* Review Content */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Rating
                  </label>
                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'star' : 'stars'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Review
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={editReviewMutation.isLoading}
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  {isOwner && (
                    <button
                      onClick={handleDelete}
                      disabled={deleteReviewMutation.isLoading}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {review.content && (
                  <p className="text-text-muted">{review.content}</p>
                )}
                
                {/* Actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => likeMutation.mutate()}
                    className="flex items-center space-x-2 text-text-muted hover:text-red-400 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    <span>{review._count?.likes || 0}</span>
                  </button>
                  
                  <button
                    className="flex items-center space-x-2 text-text-muted"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{review._count?.comments || 0} comments</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Comments */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Comments</h3>
            
            {/* Add Comment */}
            {user && (
              <form onSubmit={handleSubmitComment} className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={addCommentMutation.isLoading || !commentContent.trim()}
                  className="bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Post</span>
                </button>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {review.comments?.map((comment) => (
                <div key={comment.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      {comment.user.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={comment.user.displayName}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-foreground">
                            {comment.user.displayName?.[0] || comment.user.username?.[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {comment.user.displayName || comment.user.username}
                        </div>
                        <p className="text-sm text-text-muted">{comment.content}</p>
                        <p className="text-xs text-text-muted mt-1">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {user && user.id === comment.userId && (
                      <button
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        className="text-text-muted hover:text-red-400 transition-colors ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {review.comments?.length === 0 && (
                <p className="text-text-muted text-sm">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;