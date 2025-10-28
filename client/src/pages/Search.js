import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import { Search as SearchIcon, Music, Disc, User, Play, Plus, Clock } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState('track');
  const navigate = useNavigate();

  const { data: searchResults, isLoading, error } = useQuery(
    ['search', query, searchType],
    () => api.get(`/music/search?q=${encodeURIComponent(query)}&type=${searchType}&limit=20`).then(res => res.data),
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
      return (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to search. Please try again.</p>
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

    // Get results from the combined response
    const results = searchResults.combined || searchResults.spotify?.tracks?.items || searchResults.audius || [];

    if (results.length === 0) {
      return (
        <div className="text-center py-12">
          <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No results found for "{query}"</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.map((item) => (
          <Card key={`${item.id}-${item.source || 'spotify'}`} className="hover:bg-muted transition-colors">
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
                  ) : item.artwork ? (
                    <img
                      src={item.artwork}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate">{item.name || item.title}</h3>
                  <p className="text-muted-foreground truncate">
                    {item.source === 'audius' ? (
                      <>
                        {item.artist}
                        {item.genre && ` • ${item.genre}`}
                      </>
                    ) : (
                      <>
                        {item.artists?.map(artist => artist.name).join(', ')}
                        {item.album && ` • ${item.album.name}`}
                      </>
                    )}
                  </p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                  {item.streamUrl && (
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        Streamable
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {item.streamUrl ? (
                    <Button 
                      onClick={() => {
                        // For Audius tracks, you could implement direct playback
                        console.log('Play track:', item);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Play
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => navigate(`/music/${item.id}`)}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
    </div>
  );
};

export default Search;
