import { useState } from "react";
import { useMusicPlayer } from "@/contexts/music-player";
import { Play, Pause, SkipForward, RotateCcw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileFullscreenPlayer } from "./MobileFullscreenPlayer";
import { hapticLight } from "@/lib/native";

/**
 * Apple-Music–style floating mini player.
 *  - Floats above the bottom nav with a visible gap
 *  - Rounded card with strong shadow + backdrop blur
 *  - Circular progress ring is implicit via top progress hairline
 *  - Tap anywhere outside controls to expand the immersive full player
 */
const MobileMiniPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playbackError,
    retryPlayback,
    queue,
  } = useMusicPlayer();

  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const coverUrl = currentTrack.cover_art_path
    ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${currentTrack.cover_art_path}`
    : "/placeholder.svg";

  const handleExpand = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-stop-expand]")) return;
    hapticLight();
    setFullscreenOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "fixed left-0 right-0 z-40 lg:hidden px-2 animate-slide-up",
          "pointer-events-none"
        )}
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom, 0px) + 8px)" }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={`Now playing: ${currentTrack.title} by ${currentTrack.artist}. Tap to open full player.`}
          onClick={handleExpand}
          onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)}
          onTouchCancel={() => setPressed(false)}
          className={cn(
            "pointer-events-auto cursor-pointer select-none",
            "rounded-2xl overflow-hidden",
            "bg-card/85 backdrop-blur-xl backdrop-saturate-150",
            "border border-border/60",
            "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)]",
            "transition-transform duration-150",
            pressed && "scale-[0.985]"
          )}
        >
          {/* Progress hairline */}
          <div className="h-[2px] w-full bg-muted/60">
            <div
              className={cn(
                "h-full transition-[width] duration-300 ease-linear",
                playbackError ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-3 px-2.5 py-2">
            {/* Album art with subtle glow */}
            <div className="relative flex-shrink-0">
              <img
                src={coverUrl}
                alt={currentTrack.title}
                className="h-11 w-11 rounded-xl object-cover shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              {isPlaying && !playbackError && (
                <span className="absolute inset-0 rounded-xl ring-2 ring-primary/30 animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Title / artist or error */}
            <div className="flex-1 min-w-0">
              {playbackError ? (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive truncate">{playbackError.message}</p>
                </div>
              ) : (
                <>
                  <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                    {currentTrack.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                    {currentTrack.artist}
                  </p>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 flex-shrink-0" data-stop-expand>
              {playbackError?.canRetry ? (
                <button
                  type="button"
                  aria-label="Retry"
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticLight();
                    retryPlayback();
                  }}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground active:scale-90 transition-transform"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label={isPlaying ? "Pause" : "Play"}
                    onClick={(e) => {
                      e.stopPropagation();
                      hapticLight();
                      togglePlay();
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-full text-foreground active:scale-90 transition-transform"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-5 w-5 fill-foreground" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5 fill-foreground" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Next track"
                    disabled={queue.length === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      hapticLight();
                      playNext();
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground active:scale-90 transition-transform disabled:opacity-40"
                  >
                    <SkipForward className="h-4.5 w-4.5 fill-current" />
                  </button>
                </>
              )}
            </div>
          </div>
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
