
import { Track } from "@/types/track-types";

export interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setQueue: (tracks: Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
}
