import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'react-query';
import api from '../services/api';
import { User, Users, Star } from 'lucide-react';
import ReviewCard from '../components/ReviewCard';

const Reviews = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'friends'

  // Fetch user's reviews
  const { data: myReviewsData, isLoading: myReviewsLoading } = useQuery(
    ['userReviews', user?.id],
    () => api.get(`/reviews?userId=${user?.id}`).then(res => res.data),
    {
      enabled: !!user?.id,
    }
  );

  // Fetch friends' reviews (users that current user is following)
  const { data: friendsReviewsData, isLoading: friendsReviewsLoading } = useQuery(
    ['friendsReviews', user?.id],
    () => api.get(`/reviews/friends/${user?.id}`).then(res => res.data),
    {
      enabled: !!user?.id,
    }
  );

  const myReviews = myReviewsData?.reviews || [];
  const friendsReviews = friendsReviewsData?.reviews || [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-card rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Reviews</h1>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'my'
                ? 'bg-primary text-white'
                : 'bg-gray-700 text-text-muted hover:bg-gray-600'
            }`}
          >
            <User className="h-4 w-4" />
            <span>My Reviews</span>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'friends'
                ? 'bg-primary text-white'
                : 'bg-gray-700 text-text-muted hover:bg-gray-600'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Friends Reviews</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'my' ? (
          <MyReviewsTab
            reviews={myReviews}
            loading={myReviewsLoading}
          />
        ) : (
          <FriendsReviewsTab
            reviews={friendsReviews}
            loading={friendsReviewsLoading}
          />
        )}
      </div>
    </div>
  );
};

const MyReviewsTab = ({ reviews, loading }) => {
  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <Star className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-text-muted">You haven't reviewed any music yet</p>
          <p className="text-sm text-text-muted mt-2">
            Start by searching for music and adding your first review
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Link key={review.id} to={`/reviews/${review.id}`} className="block">
              <ReviewCard review={review} showMusicInfo={true} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const FriendsReviewsTab = ({ reviews, loading }) => {
  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">No reviews from friends yet</p>
          <p className="text-sm text-text-muted mt-2">
            Follow other users to see their reviews here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Link key={review.id} to={`/reviews/${review.id}`} className="block">
              <ReviewCard review={review} showMusicInfo={true} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;