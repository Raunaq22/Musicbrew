const axios = require('axios');

class DeezerService {
  constructor() {
    this.baseURL = 'https://api.deezer.com';
    // Deezer doesn't require API keys for basic search and track info
  }

  /**
   * Search for tracks on Deezer and get preview URLs
   * @param {string} query - Search query (song name, artist, etc.)
   * @param {string} artistName - Artist name to help match tracks
   * @param {string} trackName - Track name to help match tracks
   * @returns {Promise<Array>} Array of tracks with preview URLs
   */
  async searchTrackPreview(query, artistName, trackName) {
    try {
      // Search on Deezer
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          q: query,
          limit: 10
        },
        timeout: 5000
      });

      if (!response.data || !response.data.data) {
        return [];
      }

      const tracks = response.data.data.map(track => ({
        id: track.id,
        title: track.title,
        title_short: track.title_short,
        title_version: track.title_version,
        duration: track.duration,
        rank: track.rank,
        explicit_lyrics: track.explicit_lyrics,
        preview: track.preview,
        md5_image: track.md5_image,
        
        // Spotify-compatible format
        spotifyId: null, // We'll match this later
        name: track.title,
        artists: track.artist ? [{ name: track.artist.name }] : [],
        album: {
          name: track.album?.title || '',
          images: track.album?.cover_medium ? [{
            url: track.album.cover_medium
          }] : []
        },
        preview_url: track.preview || null,
        source: 'deezer'
      }));

      return tracks;
    } catch (error) {
      console.error('Deezer search error:', error.message);
      return [];
    }
  }

  /**
   * Get track details by Deezer ID
   * @param {string} deezerId - Deezer track ID
   * @returns {Promise<Object>} Track details
   */
  async getTrack(deezerId) {
    try {
      const response = await axios.get(`${this.baseURL}/track/${deezerId}`, {
        timeout: 5000
      });

      if (!response.data) {
        return null;
      }

      const track = response.data;
      return {
        id: track.id,
        name: track.title,
        artists: [{ name: track.artist.name }],
        album: {
          name: track.album?.title || '',
          images: track.album?.cover_medium ? [{
            url: track.album.cover_medium
          }] : []
        },
        preview_url: track.preview || null,
        duration: track.duration,
        source: 'deezer'
      };
    } catch (error) {
      console.error('Deezer get track error:', error.message);
      return null;
    }
  }

  /**
   * Match Spotify track with Deezer preview
   * @param {Object} spotifyTrack - Spotify track object
   * @returns {Promise<Object>} Track with preview URL added
   */
  async getPreviewForSpotifyTrack(spotifyTrack) {
    try {
      // Create search query from track info
      const artistName = spotifyTrack.artists?.map(a => a.name).join(' ') || '';
      const trackName = spotifyTrack.name || '';
      const query = `${artistName} ${trackName}`.trim();

      // Search for preview
      const deezerResults = await this.searchTrackPreview(query, artistName, trackName);
      
      // Find best match
      const bestMatch = this.findBestMatch(spotifyTrack, deezerResults);
      
      if (bestMatch && bestMatch.preview) {
        return {
          ...spotifyTrack,
          preview_url: bestMatch.preview,
          preview_source: 'deezer',
          deezer_id: bestMatch.id
        };
      }

      // Return track without preview_url so it gets filtered out
      return {
        ...spotifyTrack,
        preview_url: null
      };
    } catch (error) {
      console.error('Error matching track with Deezer:', error.message);
      // Return track without preview_url so it gets filtered out
      return {
        ...spotifyTrack,
        preview_url: null
      };
    }
  }

  /**
   * Find best matching track between Spotify and Deezer results
   * @param {Object} spotifyTrack - Spotify track
   * @param {Array} deezerTracks - Deezer search results
   * @returns {Object|null} Best matching track
   */
  findBestMatch(spotifyTrack, deezerTracks) {
    if (!deezerTracks || deezerTracks.length === 0) {
      return null;
    }

    const spotifyArtist = (spotifyTrack.artists?.[0]?.name || '').toLowerCase();
    const spotifyTitle = (spotifyTrack.name || '').toLowerCase();

    // Score each match
    const scored = deezerTracks.map(track => {
      let score = 0;
      
      // Artist name match (most important)
      if (track.artists?.[0]?.name) {
        const deezerArtist = track.artists[0].name.toLowerCase();
        if (deezerArtist.includes(spotifyArtist) || spotifyArtist.includes(deezerArtist)) {
          score += 10;
        }
        if (deezerArtist === spotifyArtist) {
          score += 20;
        }
      }

      // Track title match
      if (track.name) {
        const deezerTitle = track.name.toLowerCase();
        if (deezerTitle.includes(spotifyTitle) || spotifyTitle.includes(deezerTitle)) {
          score += 5;
        }
        if (deezerTitle === spotifyTitle) {
          score += 15;
        }
      }

      // Duration similarity (within 30 seconds)
      if (spotifyTrack.duration_ms && track.duration) {
        const spotifyDuration = spotifyTrack.duration_ms / 1000; // Convert to seconds
        const deezerDuration = track.duration;
        const durationDiff = Math.abs(spotifyDuration - deezerDuration);
        if (durationDiff <= 30) {
          score += 3;
        }
      }

      return { track, score };
    });

    // Sort by score and return best match if score is reasonable
    scored.sort((a, b) => b.score - a.score);
    return scored[0].score >= 5 ? scored[0].track : null;
  }

  /**
   * Get multiple track previews in batch
   * @param {Array} spotifyTracks - Array of Spotify tracks
   * @returns {Promise<Array>} Array of tracks with preview URLs
   */
  async getBatchPreviews(spotifyTracks) {
    try {
      const results = await Promise.allSettled(
        spotifyTracks.map(track => this.getPreviewForSpotifyTrack(track))
      );

      const processedTracks = results.map(result => 
        result.status === 'fulfilled' ? result.value : null
      ).filter(Boolean);
      
      const tracksWithPreviews = processedTracks.filter(track => track.preview_url);
      
      return processedTracks;
    } catch (error) {
      console.error('Batch preview fetch error:', error.message);
      return [];
    }
  }
}

module.exports = new DeezerService();