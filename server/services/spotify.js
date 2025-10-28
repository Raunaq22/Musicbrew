const axios = require('axios');

class SpotifyService {
  constructor() {
    this.baseURL = 'https://api.spotify.com/v1';
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  }

  // Get access token using authorization code
  async getAccessToken(code) {
    try {
      // Debug logging (can be removed in production)
      console.log('🔍 Spotify Token Exchange Debug:');
      console.log('  - Code:', code.substring(0, 20) + '...');
      console.log('  - Redirect URI:', this.redirectUri);
      
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      console.log('✅ Token exchange successful');
      return response.data;
    } catch (error) {
      console.error('❌ Spotify Token Exchange Error:');
      console.error('  - Status:', error.response?.status);
      console.error('  - Status Text:', error.response?.statusText);
      console.error('  - Response Data:', error.response?.data);
      console.error('  - Full Error:', error.message);
      
      // Handle specific Spotify errors
      if (error.response?.data?.error === 'invalid_grant') {
        throw new Error('Authorization code is invalid or has expired. Please try logging in again.');
      }
      
      throw new Error('Failed to get access token: ' + error.message);
    }
  }

  // Get user profile from Spotify
  async getUserProfile(accessToken) {
    try {
      console.log('🔍 Getting user profile with token:', accessToken.substring(0, 20) + '...');
      const response = await axios.get(`${this.baseURL}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log('✅ User profile retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ User Profile Error:');
      console.error('  - Status:', error.response?.status);
      console.error('  - Status Text:', error.response?.statusText);
      console.error('  - Response Data:', error.response?.data);
      console.error('  - Token used:', accessToken.substring(0, 20) + '...');
      throw new Error('Failed to get user profile: ' + error.message);
    }
  }

  // Search for tracks, albums, or artists
  async search(query, type = 'track', limit = 20, offset = 0, accessToken = null) {
    try {
      const headers = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          q: query,
          type: type,
          limit: limit,
          offset: offset,
        },
        headers,
      });
      return response.data;
    } catch (error) {
      throw new Error('Search failed: ' + error.message);
    }
  }

  // Get track details
  async getTrack(trackId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get track: ' + error.message);
    }
  }

  // Get album details
  async getAlbum(albumId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/albums/${albumId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get album: ' + error.message);
    }
  }

  // Get artist details
  async getArtist(artistId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/artists/${artistId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get artist: ' + error.message);
    }
  }

  // Get user's top tracks
  async getTopTracks(accessToken, timeRange = 'medium_term', limit = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/me/top/tracks`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          time_range: timeRange,
          limit: limit,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get top tracks: ' + error.message);
    }
  }

  // Get user's top artists
  async getTopArtists(accessToken, timeRange = 'medium_term', limit = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/me/top/artists`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          time_range: timeRange,
          limit: limit,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get top artists: ' + error.message);
    }
  }

  // Get a playlist by ID
  async getPlaylist(playlistId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/playlists/${playlistId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get playlist: ' + error.message);
    }
  }

  // Get tracks for a playlist
  async getPlaylistTracks(playlistId, accessToken, limit = 100, offset = 0) {
    try {
      const response = await axios.get(`${this.baseURL}/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get playlist tracks: ' + error.message);
    }
  }

  // Create a playlist for a user
  async createPlaylist(userSpotifyId, name, description = '', isPublic = true, accessToken) {
    try {
      const response = await axios.post(
        `${this.baseURL}/users/${userSpotifyId}/playlists`,
        { name, description, public: isPublic },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to create playlist on Spotify: ' + error.message);
    }
  }

  async addTracksToPlaylist(playlistId, uris, accessToken) {
    try {
      const response = await axios.post(
        `${this.baseURL}/playlists/${playlistId}/tracks`,
        { uris },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to add tracks to playlist: ' + error.message);
    }
  }

  async getRecommendations(accessToken, options = {}) {
    try {
      const params = {
        limit: options.limit || 10,
      };
      if (options.seed_artists) params.seed_artists = options.seed_artists;
      if (options.seed_tracks) params.seed_tracks = options.seed_tracks;
      if (options.seed_genres) params.seed_genres = options.seed_genres;

      const response = await axios.get(`${this.baseURL}/recommendations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get recommendations: ' + error.message);
    }
  }

  async getUserTopTracks(accessToken, limit = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/me/top/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get user top tracks: ' + error.message);
    }
  }

  async getAvailableGenreSeeds(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/recommendations/available-genre-seeds`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data?.genres || [];
    } catch (error) {
      throw new Error('Failed to get available genre seeds: ' + error.message);
    }
  }

  async updatePlaylistDetails(playlistId, accessToken, { name, description, isPublic }) {
    try {
      const payload = {};
      if (name !== undefined) payload.name = name;
      if (description !== undefined) payload.description = description;
      if (isPublic !== undefined) payload.public = !!isPublic;

      await axios.put(
        `${this.baseURL}/playlists/${playlistId}`,
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return { success: true };
    } catch (error) {
      throw new Error('Failed to update playlist on Spotify: ' + error.message);
    }
  }

  async unfollowPlaylist(playlistId, accessToken) {
    try {
      await axios.delete(`${this.baseURL}/playlists/${playlistId}/followers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return { success: true };
    } catch (error) {
      throw new Error('Failed to remove playlist from Spotify library: ' + error.message);
    }
  }
}

module.exports = new SpotifyService();
