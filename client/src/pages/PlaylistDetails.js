import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { Music, Play, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const PlaylistDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: playlistData, isLoading: loadingPlaylist } = useQuery(
    ['playlist', id],
    () => api.get(`/playlists/${id}`).then(res => res.data),
    { enabled: !!id }
  );

  const { data: tracksData, isLoading: loadingTracks } = useQuery(
    ['playlistTracks', id],
    () => api.get(`/playlists/${id}/tracks`).then(res => res.data),
    { enabled: !!id }
  );

  const addTracksMutation = useMutation(
    (uris) => api.post(`/playlists/${id}/tracks`, { uris }).then(res => res.data),
    {
      onSuccess: () => {
        toast.success('Tracks added to playlist');
        queryClient.invalidateQueries(['playlistTracks', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to add tracks');
      }
    }
  );

  const syncCoverMutation = useMutation(
    () => api.post(`/playlists/${id}/sync-cover`).then(res => res.data),
    {
      onSuccess: (data) => {
        toast.success(data.message || 'Cover image synced successfully');
        queryClient.invalidateQueries(['playlist', id]);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.error || 'Failed to sync cover image';
        console.error('Sync cover error:', error);
        toast.error(errorMessage);
      }
    }
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/music/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`);
      const items = res.data?.tracks?.items || [];
      const normalized = items.map(t => ({
        id: t.id,
        name: t.name,
        artists: (t.artists || []).map(a => a.name),
        album: t.album?.name,
        image: t.album?.images?.[0]?.url,
        uri: t.uri,
      }));
      setSearchResults(normalized);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const addOne = (track) => {
    if (!track?.uri) return;
    addTracksMutation.mutate([track.uri]);
  };

  const addMany = (tracks) => {
    const uris = tracks.filter(t => t.uri).map(t => t.uri);
    if (uris.length === 0) return;
    addTracksMutation.mutate(uris);
  };

  const playlist = playlistData?.playlist;
  const tracks = useMemo(() => tracksData?.tracks || [], [tracksData]);

  if (loadingPlaylist) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-12">
        <Music className="h-16 w-16 text-text-muted mx-auto mb-4" />
        <p className="text-text-muted">Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-6">
          {/* Playlist Cover */}
          <div className="flex-shrink-0">
            {playlist.coverImage ? (
              <img
                src={playlist.coverImage}
                alt={playlist.name}
                className="w-32 h-32 rounded-lg object-cover shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-600 rounded-lg flex items-center justify-center shadow-lg">
                <Music className="h-16 w-16 text-text-muted" />
              </div>
            )}
          </div>

          {/* Playlist Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-text-light mb-2">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-text-muted mb-3 max-w-2xl">{playlist.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-text-muted">
                  <span>{playlist.isPublic ? 'Public' : 'Private'}</span>
                  <span>•</span>
                  <span>Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
                  {playlist.spotifyId && (
                    <>
                      <span>•</span>
                      <span className="text-green-400">Spotify Linked</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Sync Cover Button for Spotify Playlists */}
              {playlist.spotifyId && (
                <button
                  onClick={() => syncCoverMutation.mutate()}
                  disabled={syncCoverMutation.isLoading}
                  className="ml-4 bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                  title="Sync cover image from Spotify"
                >
                  <RefreshCw className={`h-4 w-4 ${syncCoverMutation.isLoading ? 'animate-spin' : ''}`} />
                  <span className="text-sm">Sync Cover</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add tracks section */}
      <div className="bg-card rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-text-light mb-4">Add Tracks</h2>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracks to add..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mb-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-text-light font-semibold">Search Results</h3>
              <button
                onClick={() => addMany(searchResults)}
                className="text-sm bg-primary hover:bg-primary-hover text-white px-3 py-1 rounded"
              >
                Add All
              </button>
            </div>
            <div className="space-y-2">
              {searchResults.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    {t.image ? (
                      <img src={t.image} alt={t.name} className="w-10 h-10 rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
                        <Music className="h-4 w-4 text-text-muted" />
                      </div>
                    )}
                    <div>
                      <p className="text-text-light font-medium">{t.name}</p>
                      <p className="text-text-muted text-sm">{(t.artists || []).join(', ')} {t.album ? `• ${t.album}` : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addOne(t)}
                    className="text-sm bg-primary hover:bg-primary-hover text-white px-3 py-1 rounded flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tracks */}
      <div className="bg-card rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-text-light mb-4">Tracks</h2>
        {loadingTracks ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-8">
            <Music className="h-16 w-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No tracks found for this playlist</p>
            <p className="text-sm text-text-muted">If this playlist is not linked to Spotify, tracks cannot be fetched.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tracks.map((t) => (
              <div key={t.id || t.uri} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  {t.image ? (
                    <img src={t.image} alt={t.name} className="w-12 h-12 rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center">
                      <Music className="h-5 w-5 text-text-muted" />
                    </div>
                  )}
                  <div>
                    <p className="text-text-light font-medium">{t.name}</p>
                    <p className="text-text-muted text-sm">{(t.artists || []).join(', ')}</p>
                  </div>
                </div>
                {t.uri && (
                  <a
                    href={`https://open.spotify.com/track/${t.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm bg-primary hover:bg-primary-hover text-white px-3 py-1 rounded flex items-center space-x-1"
                  >
                    <Play className="h-4 w-4" />
                    <span>Open</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetails;
