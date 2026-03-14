import React, { useRef, useState, useCallback, useEffect } from "react";
import { useMusicPlayer } from "@/contexts/music-player";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Repeat1, Shuffle, Heart, ChevronDown, ListPlus,
  AlertCircle, RotateCcw
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatTime } from "@/utils/formatTime";
import { cn } from "@/lib/utils";
import { PlaybackDiagnostics } from "@/components/player/PlaybackDiagnostics";

interface MobileFullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileFullscreenPlayer = ({ isOpen, onClose }: MobileFullscreenPlayerProps) => {
  const {
    currentTrack, isPlaying, currentTime, duration, volume, isMuted,
    isLoading, repeatMode, isShuffle, queue,
    togglePlay, playNext, playPrevious, seekTo, setVolume,
    toggleMute, toggleRepeat, toggleShuffle,
    likeTrack, unlikeTrack, isTrackLiked,
    playbackError, retryPlayback
  } = useMusicPlayer();

  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); setDragY(0); onClose(); }, 300);
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) setDragY(deltaY);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragY > 120) { handleClose(); } else { setDragY(0); }
  }, [dragY, handleClose]);

  const handleLikeToggle = () => {
    if (!currentTrack) return;
    if (isTrackLiked(currentTrack.id)) { unlikeTrack(currentTrack.id); }
    else { likeTrack(currentTrack.id); }
  };

  const handleSkipBackward = () => {
    if (currentTime < 5) { playPrevious(); } else { seekTo(0); }
  };

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !currentTrack) return null;

  const coverUrl = currentTrack.cover_art_path
    ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${currentTrack.cover_art_path}`
    : '/placeholder.svg';

  const dragOpacity = isDragging ? Math.max(0.3, 1 - dragY / 400) : 1;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-background",
        isClosing ? "animate-fullscreen-slide-down" : "animate-fullscreen-slide-up"
      )}
      style={{
        transform: isDragging ? `translateY(${dragY}px)` : undefined,
        opacity: dragOpacity,
        transition: isDragging ? 'none' : undefined,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Blurred background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img src={coverUrl} alt="" className="w-full h-full object-cover blur-3xl scale-150 opacity-15"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="relative flex flex-col flex-1 px-6 pt-safe-top pb-safe-bottom">
        {/* Drag indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-foreground h-10 w-10">
            <ChevronDown className="h-6 w-6" />
          </Button>
          <div className="text-center flex-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">Now Playing</p>
            {currentTrack.album_name && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{currentTrack.album_name}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10">
            <ListPlus className="h-5 w-5" />
          </Button>
        </div>

        {/* Album artwork */}
        <div className="flex-1 flex items-center justify-center py-4 min-h-0">
          <div className="w-full max-w-[min(300px,75vw)] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
            <img src={coverUrl} alt={currentTrack.title} className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
          </div>
        </div>

        {/* Track info + like button */}
        <div className="flex items-center justify-between mt-2 mb-2">
          <div className="flex-1 min-w-0 mr-3">
            <Link to={`/track/${currentTrack.id}`} onClick={handleClose}
              className="text-lg font-bold text-foreground truncate block leading-snug">
              {currentTrack.title}
            </Link>
            <Link to={`/artist/${encodeURIComponent(currentTrack.artist)}`} onClick={handleClose}
              className="text-sm text-muted-foreground truncate block leading-snug mt-0.5">
              {currentTrack.artist}
            </Link>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLikeToggle} className="flex-shrink-0 h-10 w-10">
            <Heart className={cn("h-6 w-6 transition-all duration-200",
              isTrackLiked(currentTrack.id) ? "fill-destructive text-destructive scale-110" : "text-muted-foreground")} />
          </Button>
        </div>

        {/* Error banner */}
        {playbackError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-3">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive flex-1">{playbackError.message}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              {playbackError.canRetry && (
                <Button variant="ghost" size="sm" onClick={retryPlayback} className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                  <RotateCcw className="h-3 w-3 mr-1" /> Retry
                </Button>
              )}
              <PlaybackDiagnostics error={playbackError} />
            </div>
          </div>
        )}

        {/* Progress slider */}
        <div className="mb-4">
          <Slider value={[currentTime]} max={duration || 1} step={0.5} className="w-full"
            onValueChange={(value) => seekTo(value[0])} />
          <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground tabular-nums font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-2 mb-4">
          <Button variant="ghost" size="icon"
            className={cn("h-10 w-10", isShuffle ? "text-primary" : "text-muted-foreground")}
            onClick={toggleShuffle}>
            <Shuffle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-14 w-14 text-foreground active:scale-90 transition-transform"
            onClick={handleSkipBackward}>
            <SkipBack className="h-7 w-7 fill-foreground" />
          </Button>
          <Button onClick={togglePlay}
            className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:opacity-90 active:scale-95 transition-transform">
            {isLoading ? (
              <div className="h-7 w-7 border-[2.5px] border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-8 w-8 fill-primary-foreground" />
            ) : (
              <Play className="h-8 w-8 ml-1 fill-primary-foreground" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-14 w-14 text-foreground active:scale-90 transition-transform"
            onClick={playNext} disabled={queue.length === 0}>
            <SkipForward className="h-7 w-7 fill-foreground" />
          </Button>
          <Button variant="ghost" size="icon"
            className={cn("h-10 w-10", repeatMode !== 'off' ? "text-primary" : "text-muted-foreground")}
            onClick={toggleRepeat}>
            {repeatMode === 'one' ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center justify-center gap-3 pb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider value={[isMuted ? 0 : volume]} max={100} step={1} className="w-36"
            onValueChange={(value) => setVolume(value[0])} />
        </div>
      </div>
    </div>
  );
};
