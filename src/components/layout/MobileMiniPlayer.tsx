import { useState, useRef, useCallback } from "react";
import { useMusicPlayer } from "@/contexts/music-player";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileFullscreenPlayer } from "./MobileFullscreenPlayer";

const MobileMiniPlayer = () => {
  const {
    currentTrack, isPlaying, isLoading, currentTime, duration,
    togglePlay
  } = useMusicPlayer();

  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const coverUrl = currentTrack.cover_art_path
    ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${currentTrack.cover_art_path}`
    : '/placeholder.svg';

  const handleMiniPlayerTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't open fullscreen if user tapped the play button
    const target = e.target as HTMLElement;
    if (target.closest('[data-play-btn]')) return;
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
            className="h-full bg-primary transition-[width] duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2 bg-card/98 backdrop-blur-xl border-t border-border">
          {/* Album Art */}
          <div className="flex-shrink-0">
            <img
              src={coverUrl}
              alt={currentTrack.title}
              className="h-10 w-10 rounded-md object-cover shadow-sm"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-xs text-muted-foreground truncate leading-tight">
              {currentTrack.artist}
            </p>
          </div>

          {/* Play/Pause */}
          <button
            data-play-btn
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
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
