
import { Track } from "@/types/track-types";
import { EqBand } from "@/hooks/use-audio-engine";

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaybackError {
  type: 'network' | 'decode' | 'source' | 'timeout' | 'unknown';
  message: string;
  canRetry: boolean;
  audioUrl?: string;
  errorCode?: number;
}

export interface AudioEngineState {
  bands: EqBand[];
  eqEnabled: boolean;
  currentPreset: string;
  setEqBand: (index: number, gain: number) => void;
  applyPreset: (preset: string) => void;
  toggleEq: (enabled: boolean) => void;
  setNormalization: (enabled: boolean) => void;
  connectAudioGraph: () => void;
}

export interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  playbackError: PlaybackError | null;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setQueue: (tracks: Track[]) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  retryPlayback: () => void;
  likedTracks: Set<string>;
  savedTracks: Set<string>;
  likeTrack: (trackId: string) => Promise<boolean>;
  unlikeTrack: (trackId: string) => Promise<boolean>;
  saveTrack: (trackId: string) => Promise<boolean>;
  unsaveTrack: (trackId: string) => Promise<boolean>;
  isTrackLiked: (trackId: string) => boolean;
  isTrackSaved: (trackId: string) => boolean;
  shareTrack: (trackId: string) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  audioEngine: AudioEngineState;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  setCrossfadeEnabled: (enabled: boolean) => void;
  setCrossfadeDuration: (duration: number) => void;
}
