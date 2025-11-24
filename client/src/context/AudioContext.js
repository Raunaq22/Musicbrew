import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const currentAudioRef = useRef(null);
  const routeChangeListeners = useRef(new Set());

  // Function to notify all listeners about route changes
  const notifyRouteChange = useCallback(() => {
    routeChangeListeners.current.forEach(listener => {
      if (typeof listener === 'function') {
        listener();
      }
    });
  }, []);

  // Function to add a route change listener
  const addRouteChangeListener = useCallback((listener) => {
    routeChangeListeners.current.add(listener);
    return () => routeChangeListeners.current.delete(listener);
  }, []);

  const playPreview = async (track) => {
    if (!track.preview_url) {
      throw new Error('No preview available for this track');
    }

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    // Create new audio instance
    const audio = new Audio(track.preview_url);
    currentAudioRef.current = audio;

    // Clean up reference when audio ends
    audio.onended = () => {
      currentAudioRef.current = null;
    };

    // Clean up reference if audio encounters an error
    audio.onerror = () => {
      currentAudioRef.current = null;
    };

    await audio.play();
    return audio;
  };

  const stopCurrentPreview = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  };

  // Enhanced stop function that also notifies route change listeners
  const stopCurrentPreviewAndNotify = useCallback(() => {
    stopCurrentPreview();
    notifyRouteChange();
  }, [notifyRouteChange]);

  const isPreviewPlaying = (track) => {
    return currentAudioRef.current?.src === track.preview_url;
  };

  return (
    <AudioContext.Provider
      value={{
        playPreview,
        stopCurrentPreview,
        stopCurrentPreviewAndNotify,
        isPreviewPlaying,
        currentAudio: currentAudioRef.current,
        addRouteChangeListener,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export default AudioContext;

// Custom hook for automatic preview stopping on route changes
export const useStopPreviewOnRouteChange = () => {
  const { stopCurrentPreviewAndNotify, addRouteChangeListener } = useAudio();
  const location = useLocation();

  useEffect(() => {
    // Stop preview when route changes
    stopCurrentPreviewAndNotify();
  }, [location.pathname, stopCurrentPreviewAndNotify]);

  return null;
};