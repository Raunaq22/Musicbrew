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
}

module.exports = new SpotifyService();
