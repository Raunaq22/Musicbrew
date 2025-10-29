import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import { useMusicPlayer } from '../context/MusicPlayerContext';

export default function MusicPlayer({ 
  currentTrack, 
  queue = [], 
  onTrackEnd,
  className = "" 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const { handleTrackEnd: contextHandleTrackEnd } = useMusicPlayer();

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (!currentTrack) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(false);
      if (audioRef.current) {
        audioRef.current.src = '';
      }
      return;
    }

    console.log('🎵 Loading track:', currentTrack.name);
    console.log('🎵 Preview URL:', currentTrack.preview_url);
    
    setCurrentTime(0);
    setIsLoading(true);
    setIsPlaying(false);
    
    if (currentTrack.preview_url && audioRef.current) {
      try {
        // Use the direct Deezer URL - no proxy needed
        const audioUrl = currentTrack.preview_url;
        
        audioRef.current.preload = "metadata";
        audioRef.current.src = audioUrl;
        
        console.log('🎵 Audio setup complete with direct Deezer URL');
        console.log('🎵 Audio URL:', audioUrl);
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ Error setting up audio:', error);
        setIsLoading(false);
        toast.error('Failed to load audio');
      }
    } else {
      setIsLoading(false);
      toast.error('No preview available for this track');
    }
  }, [currentTrack]);

  const togglePlayPause = async () => {
    if (!audioRef.current || !currentTrack?.preview_url) return;

    if (isPlaying) {
      console.log('Pausing...');
      setIsPlaying(false);
      audioRef.current.pause();
    } else {
      console.log('Playing...');
      setIsLoading(true);
      
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
        console.log('🎵 Successfully playing preview');
      } catch (error) {
        console.error('❌ Error playing audio:', error);
        setIsPlaying(false);
        setIsLoading(false);
        
        if (error.name === 'NotAllowedError') {
          toast.error('Click play to enable audio');
        } else {
          toast.error('Failed to play preview');
        }
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const newTime = (e.target.value / 100) * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-black text-white p-4 shadow-lg z-50 ${className}`}>
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
          }
          setIsLoading(false);
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onEnded={() => {
          console.log('Audio ended');
          setIsPlaying(false);
          setCurrentTime(0);
          if (onTrackEnd) {
            onTrackEnd();
          } else {
            contextHandleTrackEnd();
          }
        }}
        onError={(error) => {
          console.error('Audio error:', error);
          console.error('Audio error details:', audioRef.current?.error);
          setIsPlaying(false);
          setIsLoading(false);
          
          const errorCode = audioRef.current?.error?.code;
          if (errorCode === 4) {
            toast.error('Audio format not supported');
          } else if (errorCode === 2) {
            toast.error('Network error loading audio');
          } else {
            toast.error('Failed to play audio');
          }
        }}
        onLoadStart={() => {
          setIsLoading(true);
        }}
        onCanPlay={() => {
          setIsLoading(false);
        }}
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => {
          setIsPlaying(false);
        }}
      />
      
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img 
            src={currentTrack.artwork || '/default-album.png'} 
            alt={currentTrack.name}
            className="w-14 h-14 rounded-md object-cover"
          />
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{currentTrack.name}</div>
            <div className="text-gray-400 text-xs truncate">{currentTrack.artist}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:text-green-400"
            >
              ⏮️
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={togglePlayPause}
              disabled={isLoading}
              className="text-white hover:text-green-400 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
              ) : isPlaying ? (
                '⏸️'
              ) : (
                '▶️'
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:text-green-400"
            >
              ⏭️
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-gray-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-xs text-gray-400 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume and Queue */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="text-sm text-gray-400">
            {queue.length} in queue
          </div>
        </div>
      </div>
    </div>
  );
}