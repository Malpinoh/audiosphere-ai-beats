
import React from "react";
import { useMusicPlayer } from "@/contexts/music-player";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Repeat1, Shuffle, Heart, ChevronDown, ListMusic, MoreHorizontal
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
  
  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleLikeToggle = () => {
    if (!currentTrack) return;
    if (isTrackLiked(currentTrack.id)) {
      unlikeTrack(currentTrack.id);
    } else {
      likeTrack(currentTrack.id);
    }
  };
  
  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-primary/30 via-background to-secondary/20 flex flex-col p-6 safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-foreground">
          <ChevronDown className="h-6 w-6" />
        </Button>
        <div className="text-center flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Playing from</p>
          <p className="text-xs text-foreground font-medium">Queue</p>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Album cover */}
      <div className="aspect-square w-full max-w-[280px] mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl shadow-primary/20">
        <img 
          src={currentTrack.cover || currentTrack.cover_art_path} 
          alt={currentTrack.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Track info */}
      <div className="mb-6 text-center px-4">
        <Link to={`/track/${currentTrack.id}`} className="text-lg font-bold block text-foreground hover:text-primary transition-colors">
          {currentTrack.title}
        </Link>
        <Link to={`/artist/${encodeURIComponent(currentTrack.artist)}`} className="text-base text-muted-foreground hover:text-foreground transition-colors">
          {currentTrack.artist}
        </Link>
      </div>
      
      {/* Progress bar */}
      <div className="w-full mb-6 px-2">
        <Slider
          value={[currentTime]}
          max={duration || 1}
          step={1}
          className="w-full"
          onValueChange={(value) => seekTo(value[0])}
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        <Button variant="ghost" size="icon" className={`text-muted-foreground hover:text-foreground ${isShuffle ? 'text-primary' : ''}`} onClick={toggleShuffle}>
          <Shuffle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-foreground" onClick={playPrevious}>
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
        <Button variant="ghost" size="icon" className="text-foreground" onClick={playNext}>
          <SkipForward className="h-7 w-7" />
        </Button>
        <Button variant="ghost" size="icon" className={`text-muted-foreground hover:text-foreground ${repeatMode !== 'off' ? 'text-primary' : ''}`} onClick={toggleRepeat}>
          {repeatMode === 'one' ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-auto">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={handleLikeToggle}>
          <Heart className={`h-5 w-5 ${isTrackLiked(currentTrack.id) ? 'fill-destructive text-destructive' : ''}`} />
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            className="w-20"
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
        
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <ListMusic className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
