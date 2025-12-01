import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'react-query';
import { usePerformanceMonitor } from '../components/LazyComponent';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAudio, useStopPreviewOnRouteChange } from '../context/AudioContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ResponsiveGrid, CardGrid } from '../components/ResponsiveGrid';
import { Badge } from '../components/ui/badge';
import { Star, Music, TrendingUp, Users, Play, Clock, Calendar, Sparkles, Zap, Heart, MessageCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import NewsCard from '../components/NewsCard';
import ReviewCard from '../components/ReviewCard';
import TrackPreview from '../components/TrackPreview';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { playTrack } = useMusicPlayer();
  
  // Performance monitoring
  usePerformanceMonitor('Home');

  const { playPreview } = useAudio();

  // Automatically stop preview when route changes
  useStopPreviewOnRouteChange();

  // Fetch popular tracks for authenticated users
  const { data: popularTracks, isLoading: popularLoading } = useQuery(
    'popular-tracks',
    async () => {
      const response = await api.get('/music/search', {
        params: { q: 'popular music', type: 'track', limit: 12 }
      });
      const tracks = response.data?.tracks?.items || response.data?.tracks || [];
      return tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        cover: track.album?.images?.[0]?.url || track.album?.cover || '/default-album.png',
        preview_url: track.preview_url,
        duration_ms: track.duration_ms,
        album: track.album
      }));
    },
    {
      enabled: isAuthenticated,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch trending tracks for non-authenticated users
  const { data: trendingTracks, isLoading: trendingLoading } = useQuery(
    'trending-tracks',
    async () => {
      const response = await api.get('/music/search', {
        params: { q: 'trending', type: 'track', limit: 12 }
      });
      const tracks = response.data?.tracks?.items || response.data?.tracks || [];
      return tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        cover: track.album?.images?.[0]?.url || track.album?.cover || '/default-album.png',
        preview_url: track.preview_url,
        duration_ms: track.duration_ms,
        album: track.album
      }));
    },
    {
      enabled: !isAuthenticated,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch latest reviews
  const { data: latestReviews, isLoading: reviewsLoading } = useQuery(
    'latest-reviews',
    async () => {
      const response = await api.get('/reviews/latest', { params: { limit: 2 } });
      return response.data.reviews || [];
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Fetch RSS news
  const { data: newsArticles, isLoading: newsLoading } = useQuery(
    'news-articles',
    async () => {
      const response = await api.get('/public/album-reviews');
      return response.data.items || [];
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const handlePlayTrackFromList = (track) => {
    playTrack(track);
    toast.success(`Added to queue: ${track.name}`);
  };

  const handlePlayPreview = async (track) => {
    if (!track.preview_url) {
      toast.error('No preview available for this track');
      return;
    }

    try {
      await playPreview(track);
      toast.success(`Playing preview: ${track.name}`);
    } catch (error) {
      console.error('Error playing preview:', error);
      toast.error('Failed to play preview');
    }
  };

  const displayTracks = isAuthenticated ? popularTracks : trendingTracks;
  const isDataLoading = isAuthenticated ? popularLoading : trendingLoading;

  // Welcome message based on time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const TrackCard = ({ track, index, compact = false }) => (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/20"
      onClick={() => navigate(`/music/${track.id}/track`)}
    >
      <div className="relative overflow-hidden">
        <img
          src={track.cover}
          alt={track.name}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white/20">
              <Play className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        {track.preview_url && (
          <Badge className="absolute top-3 left-3 bg-black/60 text-white border border-white/20">
            Preview Available
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-lg truncate group-hover:text-primary transition-colors">
          {track.name}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        {track.duration_ms && (
          <p className="text-xs text-muted-foreground mt-1">
            <Clock className="inline w-3 h-3 mr-1" />
            {Math.floor(track.duration_ms / 60000)}:{Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}
          </p>
        )}
        {track.preview_url && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPreview(track);
            }}
            size="sm"
            variant="outline"
            className="mt-2 text-green-400 border-green-400 hover:bg-green-400/10 w-full"
          >
            <Play className="h-3 w-3 mr-1" />
            Preview
          </Button>
        )}
      </div>
    </Card>
  );

  const StatCard = ({ title, value, icon, color = "primary" }) => {
    const IconComponent = icon;
    return (
      <Card className="p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-full bg-${color}/10`}>
            <IconComponent className={`h-8 w-8 text-${color}`} />
          </div>
        </div>
      </Card>
    );
  };

  const QuickActionCard = ({ title, description, icon, onClick, color = "primary" }) => {
    const IconComponent = icon;
    return (
      <Card 
        className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-full bg-${color}/10 group-hover:bg-${color}/20 transition-colors`}>
            <IconComponent className={`h-8 w-8 text-${color} group-hover:text-${color}/80 transition-colors`} />
          </div>
        </div>
      </Card>
    );
  };

  const SectionHeader = ({ title, subtitle, actionText, onAction }) => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {onAction && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary/80"
          onClick={onAction}
        >
          {actionText} →
        </Button>
      )}
    </div>
  );

  const LoadingGrid = ({ count = 6 }) => (
    <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3, wide: 4 }} gap={6}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="aspect-square bg-gray-700 rounded-t-lg"></div>
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </Card>
      ))}
    </ResponsiveGrid>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Unified Header - Always show welcome message */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isAuthenticated ? `${getWelcomeMessage()}, ${user?.displayName || user?.username}! 🎵` : 'Welcome to MusicBrew! 🎵'}
            </h1>
<p className="text-muted-foreground">
              {isAuthenticated ? 'Welcome back' : 'Discover, share, and connect through music'}
            </p>
          </div>
          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <a href="/login">
                  <Music className="mr-3 h-5 w-5" />
                  Connect with Spotify
                </a>
              </Button>
            </div>
          )}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-3">
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                <Heart className="mr-2 h-3 w-3" />
                Active Listener
              </Badge>
              <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                <Calendar className="mr-2 h-3 w-3" />
                Member since {new Date(user.createdAt).getFullYear()}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <QuickActionCard 
          title="Discover New Music" 
          description="Find tracks based on your listening history" 
          icon={Music}
          color="primary"
          onClick={() => navigate('/search')}
        />
        {isAuthenticated && (
          <>
            <QuickActionCard 
              title="Read Latest Reviews" 
              description="See what the community is saying" 
              icon={Star}
              color="yellow"
              onClick={() => navigate('/reviews')}
            />
            <QuickActionCard 
              title="Check News" 
              description="Latest album reviews and music news" 
              icon={TrendingUp}
              color="green"
              onClick={() => navigate('/news')}
            />
          </>
        )}
      </div>

      {/* Featured Tracks */}
      <div className="mb-12">
        <SectionHeader 
          title={isAuthenticated ? "Popular This Week" : "Trending Now"} 
          subtitle={isAuthenticated ? "Trending tracks everyone's listening to" : "Discover what everyone's listening to"} 
          actionText="View all"
          onAction={() => navigate('/search')}
        />
        {isDataLoading ? (
          <LoadingGrid count={8} />
        ) : displayTracks && displayTracks.length > 0 ? (
          <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3, wide: 4 }} gap={6}>
            {displayTracks.map((track, index) => (
              <TrackCard key={track.id} track={track} index={index} />
            ))}
          </ResponsiveGrid>
        ) : (
          <Card className="text-center py-12">
            <p className="text-muted-foreground">No tracks available at the moment.</p>
          </Card>
        )}
      </div>

      {/* Latest Reviews - Only for authenticated users */}
      {isAuthenticated && (
        <div className="mb-12">
          <SectionHeader 
            title="Latest Reviews" 
            subtitle="What our community is saying about new music" 
            actionText="View all"
            onAction={() => navigate('/reviews')}
          />
          {reviewsLoading ? (
            <LoadingGrid count={3} />
) : latestReviews && latestReviews.length > 0 ? (
             <div className="space-y-4">
               {latestReviews.slice(0, 2).map((review) => (
                 <ReviewCard key={review.id} review={review} showMusicInfo />
               ))}
             </div>
          ) : (
            <Card className="text-center py-12">
              <p className="text-muted-foreground">No reviews yet. Be the first to review a track!</p>
              <Button className="mt-4" onClick={() => navigate('/search')}>
                Find Music to Review
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Music News - Only for authenticated users */}
      {isAuthenticated && (
        <div className="mb-12">
          <SectionHeader 
            title="Music News" 
            subtitle="Latest album reviews from Pitchfork" 
            actionText="View all"
            onAction={() => navigate('/news')}
          />
          {newsLoading ? (
            <LoadingGrid count={2} />
          ) : newsArticles && newsArticles.length > 0 ? (
            <div className="space-y-4">
              {newsArticles.slice(0, 2).map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <p className="text-muted-foreground">No news articles available at the moment.</p>
            </Card>
          )}
        </div>
      )}

      {/* Features Section - Only for non-authenticated users */}
      {!isAuthenticated && (
        <div className="mb-16">
          <SectionHeader 
            title="Why MusicBrew?" 
            subtitle="Everything you need in one place" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Massive Music Library</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Access millions of tracks from all your favorite artists and genres.
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-foreground">Smart Recommendations</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Personalized playlists and recommendations based on your taste.
              </p>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground">Social Features</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Share reviews, follow friends, and discover music together.
              </p>
            </Card>
          </div>
          
          {/* Call to Action */}
          <div className="mt-12 text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <a href="/login">
                  <Music className="mr-3 h-5 w-5" />
                  Connect with Spotify
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-primary/30 text-primary hover:bg-primary/10 px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300"
              >
                <Zap className="mr-3 h-5 w-5" />
                Explore More
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Connect your Spotify account to unlock millions of tracks and personalized recommendations
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;


