
import React, { createContext, useContext, useRef, useEffect } from 'react';
import { MusicPlayerContextType } from './types';
import { useMusicPlayerState } from './useMusicPlayerState';

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicPlayerState = useMusicPlayerState(audioRef);
  
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.volume = 0.5;
      audioRef.current = audio;
      console.log('Audio element created and attached to ref');
    }
  }, []);
  
  return (
    <MusicPlayerContext.Provider value={musicPlayerState}>
      {children}
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  
  return context;
}
