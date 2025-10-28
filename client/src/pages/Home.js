import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'react-query';
import { usePerformanceMonitor } from '../components/LazyComponent';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import api from '../services/api';
import { useMusicPlayer } from '../context/MusicPlayerContext';

// Mock data for demo purposes
const mockPopularThisWeek = [
  { id: 1, name: 'Midnight Dreams', artist: 'Luna Eclipse', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
  { id: 2, name: 'Electric Nights', artist: 'Neon Pulse', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
  { id: 3, name: 'Ocean Waves', artist: 'Coastal Vibes', cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop' },
  { id: 4, name: 'Urban Symphony', artist: 'City Sounds', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
  { id: 5, name: 'Sunset Boulevard', artist: 'Golden Hour', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
  { id: 6, name: 'Mountain Echo', artist: 'Alpine Echo', cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop' },
];

const mockNewFromFriends = [
  { id: 7, name: 'Coffee Shop Sessions', artist: 'Morning Brew', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', friend: 'Sarah M.' },
  { id: 8, name: 'Late Night Radio', artist: 'Midnight FM', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', friend: 'Mike R.' },
  { id: 9, name: 'Weekend Vibes', artist: 'Chill Collective', cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop', friend: 'Emma L.' },
];

const mockPopularWithFriends = [
  { id: 10, name: 'Road Trip Anthems', artist: 'Highway Kings', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', playCount: '1.2M' },
  { id: 11, name: 'Party Starter', artist: 'Dance Machine', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', playCount: '890K' },
  { id: 12, name: 'Chill Meditation', artist: 'Zen Master', cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop', playCount: '654K' },
];

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const { playTrack } = useMusicPlayer();
  
  // Performance monitoring
  usePerformanceMonitor('Home');

  const handlePlayTrack = (track) => {
    playTrack({
      id: track.id,
      name: track.name,
      artist: track.artist,
      artwork: track.cover,
      preview_url: null // For demo
    });
  };

  const AlbumCard = ({ album, showPlayCount, showFriend }) => (
    <div 
      className="group cursor-pointer transform hover:scale-105 transition-all duration-200"
      onClick={() => handlePlayTrack(album)}
    >
      <div className="relative">
        <img
          src={album.cover}
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
          <p className="text-xs text-muted-foreground">{album.plays} plays</p>
        )}
        {showFriend && (
          <p className="text-xs text-blue-400">by {album.friend}</p>
        )}
      </div>
    </div>
  );

  const AlbumSection = ({ title, albums, showPlayCount = false, showFriend = false }) => (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          View all →
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {albums.map((album) => (
          <AlbumCard 
            key={album.id} 
            album={album} 
            showPlayCount={showPlayCount}
            showFriend={showFriend}
          />
        ))}
      </div>
    </section>
  );

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
          <div className="mt-16 space-y-8 opacity-60">
            <AlbumSection title="🔥 Popular This Week" albums={mockPopularThisWeek.slice(0, 6)} />
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

          {/* Album sections with rich covers */}
          <AlbumSection title="🔥 Popular This Week" albums={mockPopularThisWeek} />
          
          <AlbumSection 
            title="👥 New From Friends" 
            albums={mockNewFromFriends} 
            showFriend={true} 
          />
          
          <AlbumSection 
            title="🎯 Popular With Friends" 
            albums={mockPopularWithFriends} 
            showPlayCount={true} 
          />
        </>
      )}
    </div>
  );
};

export default Home;
