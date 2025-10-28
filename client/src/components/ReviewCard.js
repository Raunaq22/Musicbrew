import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Star, Heart, MessageCircle, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const ReviewCard = ({ review }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery(
    ['comments', review.id],
    () => api.get(`/reviews/${review.id}/comments`).then(res => res.data),
    {
      enabled: showComments,
    }
  );

  // Like/unlike mutation
  const likeMutation = useMutation(
    () => api.post(`/reviews/${review.id}/like`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews']);
      },
    }
  );

  // Add comment mutation
  const addCommentMutation = useMutation(
    (content) => api.post(`/reviews/${review.id}/comment`, { content }).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', review.id]);
        queryClient.invalidateQueries(['reviews']);
        setCommentContent('');
        toast.success('Comment added!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to add comment');
      },
    }
  );

  // Delete comment mutation
  const deleteCommentMutation = useMutation(
    (commentId) => api.delete(`/reviews/${review.id}/comments/${commentId}`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', review.id]);
        queryClient.invalidateQueries(['reviews']);
        toast.success('Comment deleted');
      },
    }
  );

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    addCommentMutation.mutate(commentContent);
  };

  const comments = commentsData?.comments || [];

  return (
    <div className="bg-gray-700 rounded-lg p-4">
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
              <span className="text-xs text-foreground">
                {review.user.displayName?.[0] || review.user.username?.[0]}
              </span>
            </div>
          )}
          <div>
            <Link 
              to={`/user/${review.user.username}`}
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              {review.user.displayName || review.user.username}
            </Link>
            <p className="text-sm text-text-muted">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating ? 'text-accent fill-current' : 'text-text-muted'
              }`}
            />
          ))}
        </div>
      </div>
      
      {review.content && (
        <p className="text-text-muted mb-3">{review.content}</p>
      )}
      
      <div className="flex items-center space-x-4 mb-3">
        <button
          onClick={() => likeMutation.mutate()}
          className="flex items-center space-x-1 text-text-muted hover:text-red-400 transition-colors"
        >
          <Heart className="h-4 w-4" />
          <span>{review._count?.likes || 0}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-1 text-text-muted hover:text-primary transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{review._count?.comments || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-600 mt-4 pt-4 space-y-4">
          {/* Comment Form */}
          {user && (
            <form onSubmit={handleSubmitComment} className="flex space-x-2">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={addCommentMutation.isLoading || !commentContent.trim()}
                className="bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-600 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      {comment.user.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={comment.user.displayName}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-foreground">
                            {comment.user.displayName?.[0] || comment.user.username?.[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <Link
                          to={`/user/${comment.user.username}`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {comment.user.displayName || comment.user.username}
                        </Link>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;

