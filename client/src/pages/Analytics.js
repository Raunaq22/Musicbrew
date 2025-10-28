import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const response = await api.get(`/analytics/user/${user?.id}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">No Analytics Data</h2>
        <p className="text-muted-foreground">Start reviewing music to see your analytics!</p>
      </div>
    );
  }

  const { stats, patterns } = analytics;

  // Calculate engagement rate
  const engagementRate = stats.totalReviews > 0 ? 
    Math.round((stats.likesReceived / stats.totalReviews) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Music Analytics</h1>
          <p className="text-muted-foreground mt-2">Discover your listening patterns and insights</p>
        </div>
        <div className="flex space-x-2">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-card text-muted-foreground hover:bg-background'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Reviews</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalReviews}</p>
            </div>
            <div className="w-12 h-12 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Average Rating</p>
              <p className="text-3xl font-bold text-foreground">{stats.averageRating}</p>
            </div>
            <div className="w-12 h-12 bg-accent bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Engagement Rate</p>
              <p className="text-3xl font-bold text-foreground">{engagementRate}%</p>
            </div>
            <div className="w-12 h-12 bg-primary-dark bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-dark" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Followers</p>
              <p className="text-3xl font-bold text-foreground">{stats.followersCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <span className="text-muted-foreground w-8">{rating}★</span>
                  <div className="flex-1 bg-background rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-12 text-sm">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Over Time */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Listening Activity</h2>
          {patterns && Object.keys(patterns.monthlyActivity || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(patterns.monthlyActivity || {}).map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-background rounded-full h-2">
                      <div
                        className="bg-accent rounded-full h-2"
                        style={{
                          width: `${Math.min(100, (count / Math.max(...Object.values(patterns.monthlyActivity))) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-foreground w-8 text-sm">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No activity data available</p>
          )}
        </div>
      </div>

      {/* Listening Patterns */}
      {patterns && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day of Week Activity */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Listening by Day</h2>
            {Object.keys(patterns.byDayOfWeek || {}).length > 0 ? (
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const count = patterns.byDayOfWeek[day] || 0;
                  const maxCount = Math.max(...Object.values(patterns.byDayOfWeek));
                  const height = maxCount > 0 ? (count / maxCount) * 60 + 10 : 10;
                  
                  return (
                    <div key={day} className="flex flex-col items-center space-y-2">
                      <div
                        className="bg-primary rounded-t w-full min-h-[10px] transition-all duration-300"
                        style={{ height: `${height}px` }}
                        title={`${day}: ${count} listens`}
                      />
                      <span className="text-xs text-muted-foreground">{day}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No pattern data available</p>
            )}
          </div>

          {/* Hourly Activity */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Listening by Hour</h2>
            {Object.keys(patterns.byHour || {}).length > 0 ? (
              <div className="space-y-2">
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i;
                  const count = patterns.byHour[hour] || 0;
                  const maxCount = Math.max(...Object.values(patterns.byHour));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={hour} className="flex items-center space-x-3">
                      <span className="text-muted-foreground text-sm w-12">
                        {hour.toString().padStart(2, '0')}:00
                      </span>
                      <div className="flex-1 bg-background rounded-full h-2">
                        <div
                          className="bg-primary-dark rounded-full h-2 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground text-sm w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No hourly data available</p>
            )}
          </div>
        </div>
      )}

      {/* Member Since */}
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Your Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">
              {new Date(stats.memberSince).getFullYear()}
            </p>
            <p className="text-muted-foreground">Member Since</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-accent">{stats.totalPlaylists}</p>
            <p className="text-muted-foreground">Playlists Created</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-500">{stats.followingCount}</p>
            <p className="text-muted-foreground">Artists You Follow</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;