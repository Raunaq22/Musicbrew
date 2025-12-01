import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { useAudio, useStopPreviewOnRouteChange } from '../context/AudioContext';
import api from '../services/api';
import { Star, Play, Music, MessageCircle, Disc, User, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewCard from '../components/ReviewCard';
import TrackPreview from '../components/TrackPreview';
import { Button } from '../components/ui/button';

const MusicDetails = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const { user, spotifyToken } = useAuth();
  const { playPreview } = useAudio();
  const [rating, setRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTopTracks, setExpandedTopTracks] = useState(false);
  const [expandedAlbums, setExpandedAlbums] = useState(false);

  // Automatically stop preview when route changes
  useStopPreviewOnRouteChange();

  const queryClient = useQueryClient();

  // Determine content type based on route parameter or default to track
  const contentType = type || 'track';

  // Fetch track details
  const { data: track, isLoading: trackLoading } = useQuery(
    ['track', id],
    () => api.get(`/music/track/${id}`).then(res => res.data),
    {
      enabled: !!id && !!spotifyToken && contentType === 'track',
    }
  );

  // Fetch album details
  const { data: album, isLoading: albumLoading } = useQuery(
    ['album', id],
    () => api.get(`/music/album/${id}`).then(res => res.data),
    {
      enabled: !!id && !!spotifyToken && contentType === 'album',
    }
  );

  // Fetch artist details
  const { data: artist, isLoading: artistLoading } = useQuery(
    ['artist', id],
    () => api.get(`/music/artist/${id}`).then(res => res.data),
    {
      enabled: !!id && !!spotifyToken && contentType === 'artist',
    }
  );

  // Fetch artist's top tracks
  const { data: artistTopTracks, isLoading: artistTopTracksLoading } = useQuery(
    ['artist-top-tracks', id],
    () => api.get(`/music/artist/${id}/top-tracks?limit=${expandedTopTracks ? 10 : 5}`).then(res => res.data),
    {
      enabled: !!id && !!spotifyToken && contentType === 'artist',
    }
  );

  // Fetch artist's albums
  const { data: artistAlbums, isLoading: artistAlbumsLoading } = useQuery(
    ['artist-albums', id],
    () => api.get(`/music/artist/${id}/albums?limit=${expandedAlbums ? 50 : 10}`).then(res => res.data),
    {
      enabled: !!id && !!spotifyToken && contentType === 'artist',
    }
  );

  // Fetch reviews for this track (only for tracks, not albums or artists)
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery(
    ['reviews', id],
    () => api.get(`/reviews?musicId=${id}`).then(res => res.data),
    {
      enabled: !!id && contentType === 'track',
    }
  );

  // Submit review mutation
  const submitReviewMutation = useMutation(
    (data) => api.post('/reviews', data).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews', id]);
        setRating(0);
        setReviewContent('');
        toast.success('Review submitted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to submit review');
      },
    }
  );

  const handlePlayPreview = async (track) => {
    if (!track.preview_url) {
      toast.error('No preview available for this track');
      return;
    }

    try {
      await playPreview(track);
    } catch (error) {
      console.error('Error playing preview:', error);
      toast.error('Failed to play preview');
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    submitReviewMutation.mutate({
      musicId: id,
      rating,
      content: reviewContent,
    });
  };

  const handleViewMoreTopTracks = () => {
    setExpandedTopTracks(!expandedTopTracks);
  };

  const handleViewMoreAlbums = () => {
    setExpandedAlbums(!expandedAlbums);
  };

  const reviews = reviewsData?.reviews || [];
  const isLoading = trackLoading || albumLoading || artistLoading;
  const data = track || album || artist;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Content not found</p>
        <Button 
          onClick={() => navigate(-1)}
          className="mt-4"
          variant="outline"
        >
          Go Back
        </Button>
      </div>
    );
  }

  // Track Details Component
  const renderTrackDetails = () => (
    <div className="space-y-8">
      {/* Track Header */}
      <div className="bg-card rounded-lg p-6">
        <div className="flex items-start space-x-6">
          {track.album?.images?.[0] && (
            <img
              src={track.album.images[0].url}
              alt={track.name}
              className="w-32 h-32 rounded-lg object-cover"
            />
          )}
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">{track.name}</h1>
            <p className="text-xl text-muted-foreground mb-2">
              {track.artists?.map(artist => artist.name).join(', ')}
            </p>
            {track.album && (
              <p className="text-muted-foreground mb-4">{track.album.name}</p>
            )}
            
            <div className="flex items-center space-x-4">
              <a 
                href={track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Open on Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              {track.preview_url && (
                <button
                  onClick={() => handlePlayPreview(track)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  disabled={false}
                >
                  <Play className="h-4 w-4" />
                  <span>Preview</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Track Info */}
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Track Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <span className="ml-2">{Math.floor(track.duration_ms / 60000)}:{Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Album:</span>
            <span className="ml-2">{track.album?.name || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Release Date:</span>
            <span className="ml-2">{track.album?.release_date || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Popularity:</span>
            <span className="ml-2">{track.popularity || 'Unknown'}/100</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Album Details Component
  const renderAlbumDetails = () => (
    <div className="space-y-8">
      {/* Album Header */}
      <div className="bg-card rounded-lg p-6">
        <div className="flex items-start space-x-6">
          {album.images?.[0] && (
            <img
              src={album.images[0].url}
              alt={album.name}
              className="w-32 h-32 rounded-lg object-cover"
            />
          )}
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-2">
              <Disc className="h-8 w-8 text-primary" />
              <span>{album.name}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              {album.artists?.map(artist => artist.name).join(', ')}
            </p>
            <p className="text-muted-foreground mb-4">
              {album.release_date} • {album.total_tracks} tracks
            </p>
            
            <div className="flex items-center space-x-4">
              <a 
                href={album.external_urls?.spotify || `https://open.spotify.com/album/${album.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Open on Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

{/* Tracklist */}
       <div className="bg-card rounded-lg p-6">
         <h2 className="text-xl font-semibold text-foreground mb-6">Tracklist</h2>
         <div className="space-y-2">
           {album.tracks?.items?.map((track, index) => (
             <TrackPreview
               key={track.id}
               track={track}
               album={album}
               index={index}
               showPreviewButton={true}
             />
           ))}
         </div>
       </div>
    </div>
  );

  // Artist Details Component
  const renderArtistDetails = () => (
    <div className="space-y-8">
      {/* Artist Header */}
      <div className="bg-card rounded-lg p-6">
        <div className="flex items-start space-x-6">
          {artist.images?.[0] && (
            <img
              src={artist.images[0].url}
              alt={artist.name}
              className="w-32 h-32 rounded-lg object-cover"
            />
          )}
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-2">
              <User className="h-8 w-8 text-primary" />
              <span>{artist.name}</span>
            </h1>
            <div className="space-y-2">
              {artist.followers && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Followers:</span>{' '}
                  {(artist.followers.total / 1000000).toFixed(1)}M
                </p>
              )}
              {artist.genres && artist.genres.length > 0 && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Genres:</span>{' '}
                  {artist.genres.slice(0, 3).join(', ')}
                </p>
              )}
              {artist.popularity && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Popularity:</span>{' '}
                  {artist.popularity}/100
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4 mt-4">
              <a 
                href={artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Open on Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Top Tracks */}
      {artistTopTracks && (
        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Top Tracks</h2>
            <Button
              onClick={handleViewMoreTopTracks}
              variant="outline"
              size="sm"
              className="text-primary hover:bg-primary/10"
            >
              {expandedTopTracks ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View More
                </>
              )}
            </Button>
          </div>
          <div className="space-y-3">
            {artistTopTracks.tracks?.slice(0, expandedTopTracks ? undefined : 5).map((track, index) => (
              <TrackPreview
                key={track.id}
                track={track}
                index={index}
                showPreviewButton={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Albums */}
      {artistAlbums && (
        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Albums</h2>
            <Button
              onClick={handleViewMoreAlbums}
              variant="outline"
              size="sm"
              className="text-primary hover:bg-primary/10"
            >
              {expandedAlbums ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View More
                </>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {artistAlbums.items?.slice(0, expandedAlbums ? undefined : 10).map((album) => (
              <div 
                key={album.id}
                className="bg-background rounded-lg p-4 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate(`/music/${album.id}/album`)}
              >
                {album.images?.[0] ? (
                  <img
                    src={album.images[0].url}
                    alt={album.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center mb-3">
                    <Music className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <h3 className="font-medium text-foreground text-sm line-clamp-2">{album.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{album.release_date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (contentType) {
      case 'album':
        return renderAlbumDetails();
      case 'artist':
        return renderArtistDetails();
      case 'track':
      default:
        return renderTrackDetails();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {renderContent()}

      {/* Review Form - Only show for tracks */}
      {contentType === 'track' && (
        <div className="bg-card rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Write a Review</h2>
          
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
<Star
                       className={`h-6 w-6 ${
                         star <= rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'
                       }`}
                     />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Review (optional)
              </label>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={`Share your thoughts about this ${contentType}...`}
              />
            </div>

            <button
              type="submit"
              disabled={submitReviewMutation.isLoading || rating === 0}
              className="bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              {submitReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* Reviews List - Only show for tracks */}
      {contentType === 'track' && (
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Reviews ({reviews.length})
          </h2>
          
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Be the first to review this {contentType}!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MusicDetails;
