import React from 'react';
import { useAudio } from '../context/AudioContext';
import { Button } from './ui/button';
import { Play, Music } from 'lucide-react';
import toast from 'react-hot-toast';

const TrackPreview = ({ 
  track, 
  album,
  index, 
  showIndex = true, 
  showPreviewButton = true,
  compact = false,
  className = ""
}) => {
  const { playPreview } = useAudio();

  const handlePlayPreview = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!track.preview_url) {
      toast.error('No preview available for this track');
      return;
    }

    try {
      await playPreview(track);
      toast.success(`Playing preview: ${track.name}`);
    } catch (error) {
      console.error('❌ Error playing preview:', error);
      toast.error('Failed to play preview');
    }
  };

  const baseClasses = compact 
    ? "flex items-center space-x-3 p-2 hover:bg-muted rounded transition-colors"
    : "flex items-center space-x-4 p-3 hover:bg-muted rounded-lg transition-colors";

  return (
    <div 
      className={`${baseClasses} ${className}`}
      onClick={(e) => {
        // Only play preview if the click wasn't on the button
        if (!e.target.closest('button')) {
          handlePlayPreview(e);
        }
      }}
    >
      {showIndex && (
        <span className="text-muted-foreground w-8 text-sm font-mono">
          {index !== undefined ? (index + 1).toString().padStart(2, '0') : '--'}
        </span>
      )}
      
      {/* Album Art */}
      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
        {track.album?.images?.[0] || album?.images?.[0] ? (
          <img
            src={track.album?.images?.[0]?.url || album?.images?.[0]?.url}
            alt={track.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <Music className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      
      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium text-foreground truncate ${compact ? 'text-sm' : ''}`}>
          {track.name}
        </h3>
        <p className={`text-sm truncate ${compact ? 'text-xs' : 'text-muted-foreground'}`}>
          {track.artists?.map(artist => artist.name).join(', ')}
        </p>
      </div>
      
      {/* Duration */}
      <div className={`text-right text-sm text-muted-foreground ${compact ? 'text-xs' : ''}`}>
        {track.duration_ms 
          ? `${Math.floor(track.duration_ms / 60000)}:${Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}`
          : '--:--'
        }
      </div>
      
      {/* Preview Button */}
      {showPreviewButton && track.preview_url && (
        <Button
          onClick={handlePlayPreview}
          size={compact ? "xs" : "sm"}
          variant="outline"
          className="text-green-400 border-green-400 hover:bg-green-400/10 whitespace-nowrap"
        >
          <Play className={`h-3 w-3 ${compact ? 'mr-0' : 'mr-1'}`} />
          {!compact && "Preview"}
        </Button>
      )}
    </div>
  );
};

export default TrackPreview;