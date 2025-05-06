
import React from "react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Heart, ChevronDown, ListMusic
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileFullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileFullscreenPlayer = ({ isOpen, onClose }: MobileFullscreenPlayerProps) => {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    isMuted,
    isLoading,
    queue,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    playTrack,
    removeFromQueue
  } = useMusicPlayer();
  
  const [isLiked, setIsLiked] = React.useState(false);
  const [repeat, setRepeat] = React.useState(false);
  const [shuffle, setShuffle] = React.useState(false);
  
  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const toggleLike = () => {
    setIsLiked(!isLiked);
  };
  
  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-maudio-darker flex flex-col p-6">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronDown className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon">
          <ListMusic className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Album cover */}
      <div className="aspect-square w-full max-w-xs mx-auto mb-8 rounded-xl overflow-hidden">
        <img 
          src={currentTrack.cover || currentTrack.cover_art_path} 
          alt={currentTrack.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Track info */}
      <div className="mb-8 text-center">
        <Link to={`/track/${currentTrack.id}`} className="text-xl font-bold block hover:text-primary">
          {currentTrack.title}
        </Link>
        <Link to={`/artist/${encodeURIComponent(currentTrack.artist)}`} className="text-sm text-muted-foreground hover:text-primary">
          {currentTrack.artist}
        </Link>
      </div>
      
      {/* Progress bar */}
      <div className="w-full mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={1}
            className="flex-1"
            onValueChange={(value) => seekTo(value[0])}
          />
          <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center space-x-6 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`text-muted-foreground hover:text-primary ${shuffle ? 'text-primary' : ''}`}
          onClick={() => setShuffle(!shuffle)}
        >
          <Shuffle className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary"
          onClick={playPrevious}
        >
          <SkipBack className="h-6 w-6" />
        </Button>
        <Button 
          onClick={togglePlay}
          className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-white"
        >
          {isLoading ? (
            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary"
          onClick={playNext}
        >
          <SkipForward className="h-6 w-6" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`text-muted-foreground hover:text-primary ${repeat ? 'text-primary' : ''}`}
          onClick={() => setRepeat(!repeat)}
        >
          <Repeat className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-auto">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary"
          onClick={toggleLike}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-secondary text-secondary' : ''}`} />
        </Button>
        
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-primary"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            className="w-24"
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
      </div>
    </div>
  );
};
