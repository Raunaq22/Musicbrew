import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import { Search as SearchIcon, Music, Disc, User, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import toast from 'react-hot-toast';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState('track');

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { playTrack } = useMusicPlayer();

  const playPreview = (track) => {
    console.log('=== PLAY PREVIEW CLICKED ===');
    console.log('Track object received:', track);
    console.log('Track ID:', track.id);
    console.log('Track name:', track.name);
    console.log('Has preview_url:', !!track.preview_url);
    console.log('Preview URL:', track.preview_url);
    console.log('Preview source:', track.preview_source);
    console.log('Full track object:', track);
    console.log('==========================');
    
    if (track.preview_url) {
      // Format track for music player
      const playerTrack = {
        id: track.id,
        name: track.name,
        artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        artwork: track.album?.images?.[0]?.url || track.images?.[0]?.url,
        preview_url: track.preview_url,
        source: track.preview_source || 'deezer'
      };
      
      console.log('=== FORMATTED TRACK FOR PLAYER ===');
      console.log('Player track object:', playerTrack);
      console.log('Formatted track preview URL:', playerTrack.preview_url);
      console.log('===================================');
      
      playTrack(playerTrack);
      console.log('✅ Track sent to music player');
      toast.success(`Playing preview: ${track.name}`);
    } else {
      console.log('❌ No preview URL available for:', track.name);
      toast.error('No preview available for this track');
    }
  };

  const { data: searchResults, isLoading, error } = useQuery(
    ['search', query, searchType],
    () => api.get(`/music/search?q=${encodeURIComponent(query)}&type=${searchType}&limit=20`).then(res => {
      return res.data;
    }),
    {
      enabled: !!query.trim(),
      retry: false,
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Search failed';
      
      // Show authentication prompt for Spotify-required errors
      if (errorMessage.includes('Spotify access token required') || error.response?.status === 401) {
        return (
          <div className="text-center py-12">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 max-w-md mx-auto">
              <Music className="h-16 w-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-400 mb-2">Spotify Authentication Required</h3>
              <p className="text-amber-400/80 mb-4">
                You need to sign in with Spotify to search for music.
              </p>
              <Button 
                onClick={() => navigate('/login')}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Sign in with Spotify
              </Button>
            </div>
          </div>
        );
      }
      
      return (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to search: {errorMessage}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (!searchResults) {
      return (
        <div className="text-center py-12">
          <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Enter a search term to find music</p>
        </div>
      );
    }

    // Extract results based on search type
    let results = [];
    if (searchType === 'track') {
      results = searchResults.tracks?.items || [];
    } else if (searchType === 'album') {
      results = searchResults.albums?.items || [];
    } else if (searchType === 'artist') {
      results = searchResults.artists?.items || [];
    }

    if (results.length === 0) {
      return (
        <div className="text-center py-12">
          <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No results found for "{query}"</p>
          <p className="text-sm text-muted-foreground mt-2">Try different keywords or check your spelling</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.map((item, index) => {
          const hasPreview = item.preview_url && searchType === 'track';
          
          // Debug first few items
          if (index < 3) {
            console.log(`Result ${index + 1}: ${item.name}`);
            console.log(`  - Has preview_url: ${!!item.preview_url}`);
            console.log(`  - Preview URL: ${item.preview_url || 'NONE'}`);
            console.log(`  - Search type: ${searchType}`);
            console.log(`  - Should show button: ${searchType === 'track'}`);
          }
          console.log('=== SEARCH DEBUG ===');
          console.log('Track:', item.name);
          console.log('Preview URL:', item.preview_url);
          console.log('Has preview:', !!item.preview_url);
          console.log('Search type:', searchType);
          console.log('Full item:', item);
          console.log('===================');
          
          return (
            <Card key={`${item.id}-${index}`} className="hover:bg-muted transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {/* Album artwork */}
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.album?.images?.[0] ? (
                      <img
                        src={item.album.images[0].url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : item.images?.[0] ? (
                      <img
                        src={item.images[0].url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">{item.name}</h3>
                    <p className="text-muted-foreground truncate">
                      {item.artists?.map(artist => artist.name).join(', ')}
                      {item.album && ` • ${item.album.name}`}
                      {item.followers && (
                        <span className="text-xs text-muted-foreground">
                          {' • '}{(item.followers.total / 1000).toFixed(1)}K followers
                        </span>
                      )}
                      {item.genres && item.genres.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {' • '}{item.genres.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                    {item.total_tracks && (
                      <p className="text-xs text-muted-foreground mt-1">{item.total_tracks} tracks</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Preview Button - always render for tracks */}
                    {searchType === 'track' && (
                      <Button 
                        onClick={() => playPreview(item)}
                        size="sm"
                        className={`${item.preview_url 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        }`}
                        disabled={!item.preview_url}
                        title={item.preview_url ? 'Play preview' : 'No preview available'}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {item.preview_url ? 'Preview' : 'No Preview'}
                      </Button>
                    )}
                    <Button 
                      onClick={() => navigate(`/music/${item.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Search Music</h1>
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for tracks, albums, or artists..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button type="submit">
              Search
            </Button>
          </div>
        </form>

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Music className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-400 font-medium">
                  Sign in to Search
                </p>
                <p className="text-xs text-amber-400/80 mt-1">
                  You need to sign in with Spotify to search for music. 
                  <button 
                    onClick={() => navigate('/login')} 
                    className="underline hover:no-underline ml-1"
                  >
                    Sign in now
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Type Tabs */}
        <Tabs value={searchType} onValueChange={setSearchType}>
          <TabsList>
            <TabsTrigger value="track" className="flex items-center space-x-2">
              <Music className="h-4 w-4" />
              <span>Tracks</span>
            </TabsTrigger>
            <TabsTrigger value="album" className="flex items-center space-x-2">
              <Disc className="h-4 w-4" />
              <span>Albums</span>
            </TabsTrigger>
            <TabsTrigger value="artist" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Artists</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>



      {renderSearchResults()}
      
      {/* Search Tips */}
      {!query && isAuthenticated && (
        <div className="mt-12 text-center">
          <div className="max-w-md mx-auto">
            <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Search Tips</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Try searching for artists like "Taylor Swift" or "The Beatles"</p>
              <p>• Search for song titles like "Bohemian Rhapsody"</p>
              <p>• Look up albums like "Thriller" or "Dark Side of the Moon"</p>
              <p>• Use specific genres like "indie rock" or "jazz fusion"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;