import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { LoadingScreen } from '../components/LoadingSpinner';
import { ResponsiveGrid, CardGrid } from '../components/ResponsiveGrid';
import { Users, Plus, Music, Clock, Crown } from 'lucide-react';

const ListeningRooms = () => {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '' });

  // Fetch active listening rooms
  const { data: rooms, isLoading, refetch } = useQuery(
    'listeningRooms',
    () => api.get('/listening-rooms').then(res => res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  );

  const createRoom = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/listening-rooms', newRoom);
      toast.success('Listening room created successfully!');
      setShowCreateModal(false);
      setNewRoom({ name: '', description: '' });
      refetch();
      
      // Navigate to the new room
      window.location.href = `/room/${response.data.id}`;
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create listening room');
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return <LoadingScreen message="Loading listening rooms..." />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Listening Rooms</h1>
          <p className="text-text-muted">Join rooms to listen together with friends</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Create Room</span>
        </button>
      </div>

      {/* Active Rooms */}
      {!rooms || rooms.length === 0 ? (
        <CardGrid className="text-center py-12">
          <div className="py-8">
            <Users className="h-16 w-16 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Active Rooms</h2>
            <p className="text-text-muted mb-6">
              Be the first to create a listening room and start the music session!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg transition-colors"
            >
              Create First Room
            </button>
          </div>
        </CardGrid>
      ) : (
        <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap={6}>
          {rooms.map((room) => (
            <Link key={room.id} to={`/room/${room.id}`}>
              <CardGrid className="hover:bg-background transition-all cursor-pointer group h-full">
                <div className="flex flex-col h-full">
                  {/* Room Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                        {room.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-text-muted">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{Math.floor(Math.random() * 10) + 1} listening</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeAgo(room.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-primary">
                      <Crown className="h-4 w-4" />
                      <span className="text-xs font-medium">HOST</span>
                    </div>
                  </div>

                  {/* Description */}
                  {room.description && (
                    <p className="text-text-muted text-sm mb-4 line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  {/* Current Track */}
                  {room.currentTrack ? (
                    <div className="flex items-center space-x-3 mb-4 p-3 bg-background rounded-lg">
                      <img
                        src={room.currentTrack.albumArt || '/default-album.png'}
                        alt={room.currentTrack.name}
                        className="w-10 h-10 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium text-sm truncate">
                          {room.currentTrack.name}
                        </p>
                        <p className="text-text-muted text-xs truncate">
                          {room.currentTrack.artist}
                        </p>
                      </div>
                      <Music className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 mb-4 p-3 bg-background rounded-lg">
                      <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
                        <Music className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-text-muted text-sm">No track playing</p>
                        <p className="text-text-muted text-xs">Room is idle</p>
                      </div>
                    </div>
                  )}

                  {/* Host Info */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center space-x-2">
                      <img
                        src={room.host?.avatar || '/default-avatar.png'}
                        alt={room.host?.displayName || room.host?.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-text-muted">
                        {room.host?.displayName || room.host?.username}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {room.queue?.length || 0} in queue
                    </div>
                  </div>
                </div>
              </CardGrid>
            </Link>
          ))}
        </ResponsiveGrid>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">Create Listening Room</h2>
            <form onSubmit={createRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background text-foreground rounded-lg border border-gray-600 focus:border-primary focus:outline-none"
                  placeholder="Enter room name..."
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background text-foreground rounded-lg border border-gray-600 focus:border-primary focus:outline-none"
                  placeholder="What's this room about?"
                  rows={3}
                  maxLength={200}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12">
        <CardGrid>
          <h2 className="text-xl font-semibold text-foreground mb-4">About Listening Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-foreground mb-2">Real-time Synchronization</h3>
              <p className="text-text-muted text-sm">
                All participants listen to the same track at the same time, just like being in the same room.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Live Chat</h3>
              <p className="text-text-muted text-sm">
                Chat with other listeners, share reactions, and discuss the music in real-time.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Collaborative Queue</h3>
              <p className="text-text-muted text-sm">
                Add tracks to the queue and vote on what plays next. The host controls the final order.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Host Controls</h3>
              <p className="text-text-muted text-sm">
                Room hosts can pause, skip, and manage the listening session for everyone.
              </p>
            </div>
          </div>
        </CardGrid>
      </div>
    </div>
  );
};

export default ListeningRooms;