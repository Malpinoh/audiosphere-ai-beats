import { useState, useRef, useCallback } from "react";
import { useMusicPlayer } from "@/contexts/music-player";
import { Play, Pause, RotateCcw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileFullscreenPlayer } from "./MobileFullscreenPlayer";

const MobileMiniPlayer = () => {
  const {
    currentTrack, isPlaying, isLoading, currentTime, duration,
    togglePlay, playbackError, retryPlayback
  } = useMusicPlayer();

  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const coverUrl = currentTrack.cover_art_path
    ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${currentTrack.cover_art_path}`
    : '/placeholder.svg';

  const handleMiniPlayerTap = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-play-btn]') || target.closest('[data-retry-btn]')) return;
    setFullscreenOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "fixed left-0 right-0 z-40 lg:hidden cursor-pointer",
          "animate-slide-up"
        )}
        style={{ bottom: '56px' }}
        onClick={handleMiniPlayerTap}
      >
        {/* Progress bar */}
        <div className="h-[2px] w-full bg-muted">
          <div
            className={cn("h-full transition-[width] duration-300 ease-linear", playbackError ? "bg-destructive" : "bg-primary")}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className="flex items-center gap-3 px-3 py-2"
          style={{
            backgroundColor: '#0b0f1a',
            opacity: 1,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Album Art */}
          <div className="flex-shrink-0">
            <img
              src={coverUrl}
              alt={currentTrack.title}
              className="h-10 w-10 rounded-md object-cover shadow-sm"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>

          {/* Track Info + Error */}
          <div className="flex-1 min-w-0">
            {playbackError ? (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive truncate">{playbackError.message}</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground truncate leading-tight">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {currentTrack.artist}
                </p>
              </>
            )}
          </div>

          {/* Retry or Play/Pause */}
          {playbackError?.canRetry ? (
            <button
              data-retry-btn
              onClick={(e) => { e.stopPropagation(); retryPlayback(); }}
              className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground active:scale-90 transition-transform duration-150"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : (
            <button
              data-play-btn
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform duration-150"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>
          )}
        </div>
      </div>

      <MobileFullscreenPlayer
        isOpen={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
      />
    </>
  );
};

export default MobileMiniPlayer;
