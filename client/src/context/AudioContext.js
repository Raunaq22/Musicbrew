import React, { createContext, useContext, useRef } from 'react';

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

  const isPreviewPlaying = (track) => {
    return currentAudioRef.current?.src === track.preview_url;
  };

  return (
    <AudioContext.Provider
      value={{
        playPreview,
        stopCurrentPreview,
        isPreviewPlaying,
        currentAudio: currentAudioRef.current,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export default AudioContext;