import { useMusicPlayer } from "@/contexts/music-player";
import { Play, Pause } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const MobileMiniPlayer = () => {
  const {
    currentTrack, isPlaying, isLoading, currentTime, duration,
    togglePlay
  } = useMusicPlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const coverUrl = currentTrack.cover_art_path
    ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${currentTrack.cover_art_path}`
    : 'https://picsum.photos/300/300';

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-40 lg:hidden",
        "animate-slide-up"
      )}
      style={{ bottom: '56px' }}
    >
      {/* Progress bar — thin line at top */}
      <div className="h-[2px] w-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-3 py-2 bg-card/98 backdrop-blur-xl border-t border-border">
        {/* Album Art */}
        <Link to={`/track/${currentTrack.id}`} className="flex-shrink-0">
          <img
            src={coverUrl}
            alt={currentTrack.title}
            className="h-10 w-10 rounded-md object-cover shadow-sm"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300'; }}
          />
        </Link>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <Link to={`/track/${currentTrack.id}`} className="block">
            <p className="text-sm font-medium text-foreground truncate leading-tight">
              {currentTrack.title}
            </p>
          </Link>
          <Link to={`/artist/${encodeURIComponent(currentTrack.artist)}`} className="block">
            <p className="text-xs text-muted-foreground truncate leading-tight">
              {currentTrack.artist}
            </p>
          </Link>
        </div>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform duration-150"
          disabled={!currentTrack}
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
  );
};

export default MobileMiniPlayer;
