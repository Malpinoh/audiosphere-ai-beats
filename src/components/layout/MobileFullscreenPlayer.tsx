
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
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    isMuted,
    isLoading,
    repeatMode,
    isShuffle,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    likeTrack,
    unlikeTrack,
    isTrackLiked
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
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 flex flex-col p-6">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
          <ChevronDown className="h-6 w-6" />
        </Button>
        <div className="text-center flex-1">
          <p className="text-xs text-white/60 uppercase tracking-wider">Playing from</p>
          <p className="text-sm text-white font-medium">Queue</p>
        </div>
        <Button variant="ghost" size="icon" className="text-white">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Album cover with Apple Music style shadow */}
      <div className="aspect-square w-full max-w-xs mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl">
        <img 
          src={currentTrack.cover || currentTrack.cover_art_path} 
          alt={currentTrack.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Track info */}
      <div className="mb-8 text-center px-4">
        <Link to={`/track/${currentTrack.id}`} className="text-xl font-bold block hover:text-white/80 text-white">
          {currentTrack.title}
        </Link>
        <Link to={`/artist/${encodeURIComponent(currentTrack.artist)}`} className="text-lg text-white/60 hover:text-white">
          {currentTrack.artist}
        </Link>
      </div>
      
      {/* Progress bar */}
      <div className="w-full mb-6 px-2">
        <Slider
          value={[currentTime]}
          max={duration || 1}
          step={1}
          className="w-full [&_.relative]:bg-white/20 [&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&_[role=slider]]:w-6 [&_[role=slider]]:h-6"
          onValueChange={(value) => seekTo(value[0])}
        />
        <div className="flex justify-between mt-2 text-sm text-white/60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`text-white/60 hover:text-white transition-all duration-200 ${
            isShuffle ? 'text-primary bg-primary/10' : ''
          }`}
          onClick={toggleShuffle}
        >
          <Shuffle className="h-6 w-6" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:text-white"
          onClick={playPrevious}
        >
          <SkipBack className="h-8 w-8" />
        </Button>
        <Button 
          onClick={togglePlay}
          className="h-20 w-20 rounded-full bg-white hover:bg-gray-200 text-black shadow-2xl"
        >
          {isLoading ? (
            <div className="h-8 w-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-10 w-10" />
          ) : (
            <Play className="h-10 w-10 ml-1" />
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:text-white"
          onClick={playNext}
        >
          <SkipForward className="h-8 w-8" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`text-white/60 hover:text-white transition-all duration-200 ${
            repeatMode !== 'off' ? 'text-primary bg-primary/10' : ''
          }`}
          onClick={toggleRepeat}
        >
          {repeatMode === 'one' ? (
            <Repeat1 className="h-6 w-6" />
          ) : (
            <Repeat className="h-6 w-6" />
          )}
        </Button>
      </div>
      
      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-auto">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white/60 hover:text-white"
          onClick={handleLikeToggle}
        >
          <Heart className={`h-6 w-6 ${isTrackLiked(currentTrack.id) ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/60 hover:text-white"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            className="w-24 [&_.relative]:bg-white/20 [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
        
        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
          <ListMusic className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};
