import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { api } from '../services/api';

const PreviewDebugger = () => {
  const [searchQuery, setSearchQuery] = useState('let down');
  const [debugResults, setDebugResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/music/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=3`);
      const tracks = response.data.tracks?.items || [];
      
      console.log('Debug: Full response data:', response.data);
      console.log('Debug: Tracks:', tracks);
      
      const debugInfo = tracks.map((track, index) => ({
        index: index + 1,
        name: track.name,
        artists: track.artists?.map(a => a.name).join(', '),
        preview_url: track.preview_url || 'NO PREVIEW',
        preview_source: track.preview_source || 'NONE',
        has_preview: !!track.preview_url,
        url_length: track.preview_url ? track.preview_url.length : 0
      }));
      
      setDebugResults({
        tracks: debugInfo,
        summary: {
          total: tracks.length,
          with_previews: tracks.filter(t => t.preview_url).length,
          without_previews: tracks.filter(t => !t.preview_url).length
        }
      });
      
      // Test first preview URL
      const firstTrackWithPreview = tracks.find(t => t.preview_url);
      if (firstTrackWithPreview) {
        console.log('Testing preview URL:', firstTrackWithPreview.preview_url);
        
        try {
          const audio = new Audio(firstTrackWithPreview.preview_url);
          audio.crossOrigin = "anonymous";
          
          audio.addEventListener('loadstart', () => console.log('Audio: loadstart'));
          audio.addEventListener('loadeddata', () => console.log('Audio: loadeddata'));
          audio.addEventListener('canplay', () => console.log('Audio: canplay'));
          audio.addEventListener('error', (e) => console.log('Audio: error', e));
          audio.addEventListener('ended', () => console.log('Audio: ended'));
          
          await audio.play();
          console.log('SUCCESS: Preview audio played!');
          
        } catch (error) {
          console.log('FAILED: Preview audio error:', error.message);
        }
      }
      
    } catch (error) {
      console.error('Debug failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">Preview URL Debugger</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter search query..."
            className="w-full p-2 bg-background border border-border rounded"
          />
          <Button onClick={runDebug} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Debug Search'}
          </Button>
        </div>
        
        {debugResults && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Summary:</h4>
            <p className="text-sm">
              Total tracks: {debugResults.summary.total} | 
              With previews: {debugResults.summary.with_previews} | 
              Without previews: {debugResults.summary.without_previews}
            </p>
            
            <h4 className="font-semibold mt-4">Track Details:</h4>
            <div className="space-y-2">
              {debugResults.tracks.map((track, index) => (
                <div key={index} className="text-xs bg-muted p-2 rounded">
                  <div><strong>{track.index}. {track.name}</strong></div>
                  <div>Artist: {track.artists}</div>
                  <div>Preview URL: {track.preview_url}</div>
                  <div>Source: {track.preview_source} | Length: {track.url_length}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PreviewDebugger;