import React, { createContext, useContext, useState } from 'react';

const MusicPlayerContext = createContext();

export function MusicPlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);

  const playTrack = (track) => {
    setCurrentTrack(track);
    // Add to queue if not already there
    if (!queue.find(t => t.id === track.id)) {
      setQueue(prev => [...prev, track]);
    }
  };

  const addToQueue = (track) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (trackId) => {
    setQueue(prev => prev.filter(track => track.id !== trackId));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentTrack(null);
  };

  const handleTrackEnd = () => {
    const currentIndex = queue.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex < queue.length - 1) {
      setCurrentTrack(queue[currentIndex + 1]);
    } else {
      // End of queue
      setCurrentTrack(null);
    }
  };

  return (
    <MusicPlayerContext.Provider value={{
      currentTrack,
      queue,
      playTrack,
      addToQueue,
      removeFromQueue,
      clearQueue,
      handleTrackEnd
    }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
}