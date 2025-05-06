
import React, { createContext, useContext } from 'react';
import { MusicPlayerContextType } from './types';
import { useMusicPlayerState } from './useMusicPlayerState';

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const musicPlayerState = useMusicPlayerState();
  
  return (
    <MusicPlayerContext.Provider value={musicPlayerState}>
      {children}
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
