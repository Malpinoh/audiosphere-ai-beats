import React from "react";
import { useMusicPlayer } from "@/contexts/music-player";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Repeat1, Shuffle, Heart, ChevronDown, ListMusic
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatTime } from "@/utils/formatTime";
import { supabase } from "@/integrations/supabase/client";

interface MobileFullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileFullscreenPlayer = ({ isOpen, onClose }: MobileFullscreenPlayerProps) => {
  const {
    currentTrack, isPlaying, currentTime, duration, volume, isMuted,
    isLoading, repeatMode, isShuffle,
    togglePlay, playNext, playPrevious, seekTo, setVolume,
    toggleMute, toggleRepeat, toggleShuffle,
    likeTrack, unlikeTrack, isTrackLiked
  } = useMusicPlayer();

  const handleLikeToggle = () => {
    if (!currentTrack) return;
    if (isTrackLiked(currentTrack.id)) {
      unlikeTrack(currentTrack.id);
    } else {
      likeTrack(currentTrack.id);
    }
  };

  const handleSkipBackward = () => {
    if (currentTime < 5) {
      playPrevious();
    } else {
      seekTo(0);
    }
  };

  if (!isOpen || !currentTrack) return null;

  const getCoverUrl = (track: typeof currentTrack) => {
    const path = track?.cover_art_path || track?.cover;
    if (!path) return '/placeholder.svg';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('cover_art').getPublicUrl(path);
    return data?.publicUrl || '/placeholder.svg';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col safe-area-inset">
      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={getCoverUrl(currentTrack)}
          alt=""
          className="w-full h-full object-cover blur-3xl scale-150 opacity-20"
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="relative flex flex-col flex-1 px-6 pt-3 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-foreground h-10 w-10">
            <ChevronDown className="h-6 w-6" />
          </Button>
          <div className="text-center flex-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Now Playing</p>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10">
            <ListMusic className="h-5 w-5" />
          </Button>
        </div>

        {/* Album cover - takes available space */}
        <div className="flex-1 flex items-center justify-center py-2">
          <div className="w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
            <img
              src={getCoverUrl(currentTrack)}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>
        </div>

        {/* Track info + like */}
        <div className="flex items-center justify-between mt-4 mb-5">
          <div className="flex-1 min-w-0 mr-3">
            <Link
              to={`/track/${currentTrack.id}`}
              onClick={onClose}
              className="text-lg font-bold block text-foreground truncate"
            >
              {currentTrack.title}
            </Link>
            <Link
              to={`/artist/${encodeURIComponent(currentTrack.artist)}`}
              onClick={onClose}
              className="text-sm text-muted-foreground truncate block"
            >
              {currentTrack.artist}
            </Link>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLikeToggle} className="flex-shrink-0">
            <Heart className={`h-6 w-6 ${isTrackLiked(currentTrack.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={1}
            className="w-full"
            onValueChange={(value) => seekTo(value[0])}
          />
          <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between px-2 mb-6">
          <Button variant="ghost" size="icon" className={`h-10 w-10 ${isShuffle ? 'text-primary' : 'text-muted-foreground'}`} onClick={toggleShuffle}>
            <Shuffle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12 text-foreground" onClick={handleSkipBackward}>
            <SkipBack className="h-7 w-7" />
          </Button>
          <Button onClick={togglePlay} className="h-16 w-16 rounded-full maudio-gradient-bg shadow-xl shadow-primary/30 hover:opacity-90">
            {isLoading ? (
              <div className="h-7 w-7 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12 text-foreground" onClick={playNext}>
            <SkipForward className="h-7 w-7" />
          </Button>
          <Button variant="ghost" size="icon" className={`h-10 w-10 ${repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}`} onClick={toggleRepeat}>
            {repeatMode === 'one' ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
          </Button>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            className="w-32"
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
      </div>
    </div>
  );
};
