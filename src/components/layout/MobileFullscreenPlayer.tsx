import { useRef, useState, useCallback, useEffect } from "react";
import { useMusicPlayer } from "@/contexts/music-player";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Repeat1, Shuffle, Heart, ChevronDown, ListMusic,
  AlertCircle, RotateCcw, Settings2, Plus, Share2, Bookmark,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatTime } from "@/utils/formatTime";
import { cn } from "@/lib/utils";
import { PlaybackDiagnostics } from "@/components/player/PlaybackDiagnostics";
import { TrackMetadataCard } from "@/components/player/TrackMetadataCard";
import { SongDnaCard } from "@/components/player/SongDnaCard";
import { RelatedTracksSection } from "@/components/player/RelatedTracksSection";
import { QueueDrawer } from "@/components/player/QueueDrawer";
import { PlaybackSettingsDrawer } from "@/components/player/PlaybackSettingsDrawer";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileFullscreenPlayer = ({ isOpen, onClose }: Props) => {
  const {
    currentTrack, isPlaying, currentTime, duration, volume, isMuted,
    isLoading, repeatMode, isShuffle, queue,
    togglePlay, playNext, playPrevious, seekTo, setVolume,
    toggleMute, toggleRepeat, toggleShuffle,
    likeTrack, unlikeTrack, isTrackLiked,
    saveTrack, unsaveTrack, isTrackSaved,
    addToQueue, shareTrack,
    playbackError, retryPlayback,
  } = useMusicPlayer();

  const [isClosing, setIsClosing] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Drag-down to close — tracked on the header strip only
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const dragMode = useRef<"close" | "settings" | null>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setDragY(0);
      onClose();
    }, 250);
  }, [onClose]);

  const onTopHandleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragMode.current = null;
  };
  const onTopHandleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current == null) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dragMode.current == null) {
      // Decide direction on first significant move
      if (Math.abs(dy) > 8) dragMode.current = dy > 0 ? "close" : "settings";
    }
    if (dragMode.current === "close" && dy > 0) setDragY(dy);
  };
  const onTopHandleTouchEnd = () => {
    if (dragMode.current === "close") {
      if (dragY > 100) handleClose();
      else setDragY(0);
    } else if (dragMode.current === "settings") {
      setSettingsOpen(true);
    }
    dragStartY.current = null;
    dragMode.current = null;
  };

  const handleLikeToggle = () => {
    if (!currentTrack) return;
    isTrackLiked(currentTrack.id) ? unlikeTrack(currentTrack.id) : likeTrack(currentTrack.id);
  };
  const handleSaveToggle = () => {
    if (!currentTrack) return;
    isTrackSaved(currentTrack.id) ? unsaveTrack(currentTrack.id) : saveTrack(currentTrack.id);
  };
  const handleShare = async () => {
    if (!currentTrack) return;
    const url = `${window.location.origin}/track/${currentTrack.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: currentTrack.title, text: currentTrack.artist, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard", { duration: 2500 });
      }
    } catch {}
    shareTrack(currentTrack.id);
  };
  const handleAddToQueue = () => {
    if (!currentTrack) return;
    addToQueue(currentTrack);
    toast.success("Added to queue", { duration: 2000 });
  };
  const handleSkipBackward = () => (currentTime < 5 ? playPrevious() : seekTo(0));

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !currentTrack) return null;

  const coverUrl = currentTrack.cover_art_path
    ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${currentTrack.cover_art_path}`
    : "/placeholder.svg";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-background overflow-hidden",
        isClosing ? "animate-fullscreen-slide-down" : "animate-fullscreen-slide-up"
      )}
      style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined }}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={coverUrl}
          alt=""
          className="w-full h-full object-cover blur-3xl scale-150 opacity-15"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
        <div className="absolute inset-0 bg-background/85" />
      </div>

      {/* Top header — gesture zone for swipe-down */}
      <div
        className="relative z-10 flex items-center justify-between px-4 pt-safe-top pt-3 pb-2"
        onTouchStart={onTopHandleTouchStart}
        onTouchMove={onTopHandleTouchMove}
        onTouchEnd={onTopHandleTouchEnd}
      >
        <Button variant="ghost" size="icon" onClick={handleClose} className="h-11 w-11">
          <ChevronDown className="h-6 w-6" />
        </Button>
        <div className="flex flex-col items-center pointer-events-none">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/40 mb-1.5" />
          <p className="text-[10px] uppercase tracking-[0.15em] font-medium text-muted-foreground">
            Now Playing
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={() => setSettingsOpen(true)}
          aria-label="Playback settings"
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="absolute inset-0 top-[60px] pt-safe-top pb-safe-bottom overflow-y-auto overscroll-contain">
        <div className="px-4 pb-24 space-y-5">
          {/* Artwork */}
          <div className="flex items-center justify-center pt-4">
            <div className="w-full max-w-[min(360px,80vw)] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
              <img
                src={coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.svg")}
              />
            </div>
          </div>

          {/* Title + artist + like */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Link
                to={`/track/${currentTrack.id}`}
                onClick={handleClose}
                className="text-xl font-bold text-foreground truncate block leading-snug"
              >
                {currentTrack.title}
              </Link>
              <Link
                to={`/artist/${encodeURIComponent(currentTrack.artist)}`}
                onClick={handleClose}
                className="text-sm text-muted-foreground truncate block leading-snug mt-0.5"
              >
                {currentTrack.artist}
              </Link>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLikeToggle} className="h-11 w-11 flex-shrink-0">
              <Heart
                className={cn(
                  "h-6 w-6 transition-all",
                  isTrackLiked(currentTrack.id)
                    ? "fill-destructive text-destructive scale-110"
                    : "text-muted-foreground"
                )}
              />
            </Button>
          </div>

          {/* Error banner */}
          {playbackError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-xs text-destructive flex-1">{playbackError.message}</p>
              {playbackError.canRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retryPlayback}
                  className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Retry
                </Button>
              )}
              <PlaybackDiagnostics error={playbackError} />
            </div>
          )}

          {/* Progress */}
          <div>
            <Slider
              value={[currentTime]}
              max={duration || 1}
              step={0.5}
              onValueChange={(v) => seekTo(v[0])}
            />
            <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground tabular-nums font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(Math.max(0, (duration || 0) - currentTime))}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center justify-between px-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-11 w-11", isShuffle ? "text-primary" : "text-muted-foreground")}
              onClick={toggleShuffle}
            >
              <Shuffle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 text-foreground active:scale-90 transition-transform"
              onClick={handleSkipBackward}
            >
              <SkipBack className="h-7 w-7 fill-foreground" />
            </Button>
            <Button
              onClick={togglePlay}
              className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 active:scale-95 transition-transform"
            >
              {isLoading ? (
                <div className="h-7 w-7 border-[2.5px] border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-8 w-8 fill-primary-foreground" />
              ) : (
                <Play className="h-8 w-8 ml-1 fill-primary-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 text-foreground active:scale-90 transition-transform"
              onClick={playNext}
              disabled={queue.length === 0}
            >
              <SkipForward className="h-7 w-7 fill-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-11 w-11", repeatMode !== "off" ? "text-primary" : "text-muted-foreground")}
              onClick={toggleRepeat}
            >
              {repeatMode === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
            </Button>
          </div>

          {/* Secondary actions */}
          <div className="flex items-center justify-around">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-muted-foreground"
              onClick={handleSaveToggle}
              aria-label="Save"
            >
              <Bookmark
                className={cn(
                  "h-5 w-5",
                  isTrackSaved(currentTrack.id) ? "fill-primary text-primary" : ""
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-muted-foreground"
              onClick={handleAddToQueue}
              aria-label="Add to queue"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-muted-foreground"
              onClick={() => setQueueOpen(true)}
              aria-label="View queue"
            >
              <ListMusic className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-muted-foreground"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              className="flex-1"
              onValueChange={(v) => setVolume(v[0])}
            />
          </div>

          {/* Metadata */}
          <TrackMetadataCard track={currentTrack} />

          {/* Song DNA */}
          <SongDnaCard track={currentTrack} />

          {/* Related */}
          <RelatedTracksSection trackId={currentTrack.id} />
        </div>
      </div>

      <QueueDrawer open={queueOpen} onOpenChange={setQueueOpen} />
      <PlaybackSettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};
