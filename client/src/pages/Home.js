import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'react-query';
import { usePerformanceMonitor } from '../components/LazyComponent';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import api from '../services/api';
import toast from 'react-hot-toast';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Performance monitoring
  usePerformanceMonitor('Home');

  // Fetch popular tracks for authenticated users
  const { data: popularTracks, isLoading: popularLoading } = useQuery(
    'popular-tracks',
    async () => {
      const response = await api.get('/music/search', {
        params: { q: 'popular music', type: 'track', limit: 6 }
      });
      const tracks = response.data?.tracks?.items || response.data?.tracks || [];
      // Convert tracks to album format
      return tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        cover: track.album?.images?.[0]?.url || track.album?.cover || '/default-album.png',
        preview_url: track.preview_url
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
        params: { q: 'trending', type: 'track', limit: 6 }
      });
      const tracks = response.data?.tracks?.items || response.data?.tracks || [];
      // Convert tracks to album format
      return tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        cover: track.album?.images?.[0]?.url || track.album?.cover || '/default-album.png',
        preview_url: track.preview_url
      }));
    },
    {
      enabled: !isAuthenticated,
      refetchOnWindowFocus: false,
    }
  );

  const handlePlayTrack = async (track) => {
    if (!track.preview_url) {
      toast.error('No preview available for this track');
      return;
    }

    try {
      const audio = new Audio(track.preview_url);
      toast.success(`Playing preview: ${track.name}`);
      await audio.play();
      console.log('🎵 Preview playing:', track.name);
    } catch (error) {
      console.error('❌ Error playing preview:', error);
      toast.error('Failed to play preview');
    }
  };

  const AlbumCard = ({ album, showPlayCount, showFriend }) => (
    <div 
      className="group cursor-pointer transform hover:scale-105 transition-all duration-200"
      onClick={() => handlePlayTrack(album)}
    >
      <div className="relative">
        <img
          src={album.album?.cover || album.cover || '/default-album.png'}
          alt={album.name}
          className="w-full aspect-square object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">▶️</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {album.name}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{album.artist}</p>
        {showPlayCount && (
          <p className="text-xs text-muted-foreground">{album.play_count || album.plays || '0'} plays</p>
        )}
        {showFriend && (
          <p className="text-xs text-blue-400">by {album.friend || 'Friend'}</p>
        )}
      </div>
    </div>
  );

  const AlbumSection = ({ title, albums = [], showPlayCount = false, showFriend = false, isLoading = false }) => {
    // Ensure albums is always an array
    const albumList = Array.isArray(albums) ? albums : [];
    
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View all →
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full aspect-square bg-gray-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : albumList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {albumList.map((album) => (
              <AlbumCard 
                key={album.id} 
                album={album} 
                showPlayCount={showPlayCount}
                showFriend={showFriend}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No {title.toLowerCase()} available at the moment.</p>
          </div>
        )}
      </section>
    );
  };

  const displayTracks = isAuthenticated ? popularTracks : trendingTracks;
  const isDataLoading = isAuthenticated ? popularLoading : trendingLoading;

  return (
    <div className="max-w-7xl mx-auto">
      {!isAuthenticated ? (
        /* Welcome screen for non-authenticated users */
        <div className="text-center py-20">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MusicBrew
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover, share, and connect through music. Join thousands of music lovers in the ultimate social music experience.
            </p>
          </div>
          
          <div className="space-y-6">
            <Button asChild size="lg" className="bg-green-500 hover:bg-green-600">
              <a href="/login">
                🔗 Connect with Spotify
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">
              Connect your Spotify account to get started
            </p>
          </div>

          {/* Preview sections for non-authenticated users */}
          <div className="mt-16 space-y-8">
            <AlbumSection 
              title="🔥 Trending Now" 
              albums={displayTracks || []} 
              isLoading={isDataLoading}
            />
          </div>
        </div>
      ) : (
        /* Rich content for authenticated users */
        <>
          {/* Welcome header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.displayName || user?.username}!
            </h1>
            <p className="text-muted-foreground">Here's what's happening in your music world</p>
          </div>

          {/* Album sections with real data */}
          <AlbumSection 
            title="🔥 Popular This Week" 
            albums={displayTracks || []} 
            isLoading={isDataLoading}
          />
          
          {/* Add more sections as needed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🎯 Recommended for You</h3>
              <p className="text-muted-foreground">Based on your listening history</p>
            </div>
            
            <div className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">👥 Friends' Activity</h3>
              <p className="text-muted-foreground">See what your friends are playing</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
