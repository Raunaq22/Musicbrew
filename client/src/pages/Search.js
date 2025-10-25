import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../services/api';
import { Search as SearchIcon, Music, Disc, User, Star } from 'lucide-react';

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-400">Failed to search. Please try again.</p>
        </div>
      );
    }

    if (!searchResults) {
      return (
        <div className="text-center py-12">
          <SearchIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Enter a search term to find music</p>
        </div>
      );
    }

    const results = searchResults[`${searchType}s`]?.items || [];

    if (results.length === 0) {
      return (
        <div className="text-center py-12">
          <Music className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No results found for "{query}"</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-4">
              {item.album?.images?.[0] && (
                <img
                  src={item.album.images[0].url}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                <p className="text-gray-300">
                  {searchType === 'track' ? (
                    <>
                      {item.artists?.map(artist => artist.name).join(', ')}
                      {item.album && ` • ${item.album.name}`}
                    </>
                  ) : searchType === 'album' ? (
                    <>
                      {item.artists?.map(artist => artist.name).join(', ')}
                      {item.release_date && ` • ${new Date(item.release_date).getFullYear()}`}
                    </>
                  ) : (
                    <>
                      {item.genres?.slice(0, 2).join(', ')}
                      {item.followers && ` • ${item.followers.total.toLocaleString()} followers`}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => navigate(`/music/${item.id}`)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Search Music</h1>
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for tracks, albums, or artists..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Search Type Tabs */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          {[
            { value: 'track', label: 'Tracks', icon: Music },
            { value: 'album', label: 'Albums', icon: Disc },
            { value: 'artist', label: 'Artists', icon: User },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSearchType(value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                searchType === value
                  ? 'bg-green-500 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {renderSearchResults()}
    </div>
  );
};

export default Search;
