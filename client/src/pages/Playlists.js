import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Music, Plus, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Playlists = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Fetch user's playlists
  const { data: playlistsData, isLoading } = useQuery(
    ['playlists', user?.id],
    () => api.get(`/playlists?userId=${user?.id}`).then(res => res.data),
    {
      enabled: !!user?.id,
    }
  );

  // Create playlist mutation
  const createPlaylistMutation = useMutation(
    (data) => api.post('/playlists', data).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['playlists', user?.id]);
        setIsCreating(false);
        setFormData({ name: '', description: '', isPublic: true });
        toast.success('Playlist created!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create playlist');
      },
    }
  );

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation(
    (playlistId) => api.delete(`/playlists/${playlistId}`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['playlists', user?.id]);
        toast.success('Playlist deleted');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete playlist');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Playlist name is required');
      return;
    }
    createPlaylistMutation.mutate(formData);
  };

  const confirmDelete = (playlistId) => {
    if (window.confirm('Are you sure you want to delete this playlist? This will also remove it from your Spotify library if linked.')) {
      deletePlaylistMutation.mutate(playlistId);
    }
  };

  const playlists = playlistsData?.playlists || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Playlists</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Create Playlist Form */}
      {isCreating && (
        <div className="bg-card rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Create New Playlist</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Playlist Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="My Awesome Playlist"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="What's this playlist about?"
              />
            </div>

            {/* All playlists are public; privacy toggle removed */}

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={createPlaylistMutation.isLoading}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors"
              >
                {createPlaylistMutation.isLoading ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setFormData({ name: '', description: '' });
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Playlists List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg">
          <Music className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted mb-2">No playlists yet</p>
          <p className="text-sm text-text-muted">Create your first playlist to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-card rounded-lg p-4 hover:bg-gray-700 transition-colors">
              <div className="flex items-start space-x-3">
                {/* Playlist Cover Image */}
                <div className="flex-shrink-0">
                  {playlist.coverImage ? (
                    <img
                      src={playlist.coverImage}
                      alt={playlist.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                      <Music className="h-8 w-8 text-text-muted" />
                    </div>
                  )}
                </div>

                {/* Playlist Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-foreground truncate">
                          {playlist.name}
                        </h3>
                        {/* Privacy icon removed; all are public */}
                      </div>
                      {playlist.description && (
                        <p className="text-text-muted text-sm mb-2 line-clamp-2">{playlist.description}</p>
                      )}
                      <p className="text-xs text-text-muted">
                        Created {new Date(playlist.createdAt).toLocaleDateString()}
                        {playlist.spotifyId && (
                          <span className="ml-2 text-green-400">• Spotify</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => confirmDelete(playlist.id)}
                      className="text-text-muted hover:text-red-400 transition-colors ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => navigate(`/playlists/${playlist.id}`)}
                    className="mt-3 w-full bg-gray-700 hover:bg-gray-600 text-foreground px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    View Playlist
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlists;

