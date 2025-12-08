import React from "react";
import { Play, Pause, Heart, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/music-player";
import { Link } from "react-router-dom";
import { Track } from "@/types/track-types";
import { toast } from "sonner";
import { formatDuration } from "@/utils/formatTime";

interface TrackCardProps {
  track: Track;
  showArtist?: boolean;
  hidePlay?: boolean;
  variant?: "list" | "card";
}

export function TrackCard({ track, showArtist = true, hidePlay = false, variant = "card" }: TrackCardProps) {
  const { playTrack, togglePlay, currentTrack, isPlaying, isTrackLiked, likeTrack, unlikeTrack, addToQueue } = useMusicPlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  const hasAudioUrl = track.audioUrl || track.audio_file_path;
  const liked = isTrackLiked(track.id);

  const getCoverUrl = (path: string | undefined) => {
    if (!path) return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop';
    if (path.startsWith('http')) return path;
    return `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${path}`;
  };
  
  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCurrentTrack) {
      togglePlay();
    } else if (track) {
      playTrack(track);
    }
  };
  
  const handleLikeClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (liked) {
      await unlikeTrack(track.id);
    } else {
      await likeTrack(track.id);
    }
  };
  
  const handleAddToQueue = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToQueue(track);
    toast.success(`Added "${track.title}" to queue`);
  };

  // Card variant - large artwork with overlay
  if (variant === "card") {
    return (
      <Link to={`/track/${track.id}`} className="group block">
        <div className="relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          {/* Cover Art */}
          <div className="relative aspect-square overflow-hidden">
            <img 
              src={getCoverUrl(track.cover_art_path || track.cover)} 
              alt={track.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop';
              }}
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Play button overlay */}
            {!hidePlay && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                {!hasAudioUrl ? (
                  <div className="h-14 w-14 rounded-full bg-muted/80 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                ) : (
                  <Button 
                    onClick={handlePlayClick}
                    className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 hover:scale-110 transition-all duration-200 shadow-lg shadow-primary/30"
                    size="icon"
                  >
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-1" />
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                onClick={handleAddToQueue}
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleLikeClick}
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm"
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-secondary text-secondary' : ''}`} />
              </Button>
            </div>

            {/* Duration badge */}
            {track.duration && track.duration > 0 && (
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium">
                {formatDuration(track.duration)}
              </div>
            )}
          </div>
          
          {/* Track info */}
          <div className="p-4">
            <h3 className={`font-semibold truncate text-base ${isCurrentTrack ? 'text-primary' : 'text-foreground'}`}>
              {track.title}
            </h3>
            {showArtist && (
              <p className="text-muted-foreground text-sm truncate mt-1">{track.artist}</p>
            )}
            {track.genre && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                {track.genre}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // List variant - compact row layout
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <Link to={`/track/${track.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        {/* Small cover art */}
        <div className="relative flex-shrink-0">
          <img 
            src={getCoverUrl(track.cover_art_path || track.cover)}
            alt={track.title} 
            className="w-14 h-14 rounded-lg object-cover shadow-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop';
            }}
          />
          
          {!hidePlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              {!hasAudioUrl ? (
                <AlertCircle className="h-5 w-5 text-white" />
              ) : (
                <Button 
                  onClick={handlePlayClick}
                  className="h-8 w-8 p-0 bg-primary/90 hover:bg-primary rounded-full"
                  size="icon"
                >
                  {isCurrentTrack && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Track info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${isCurrentTrack ? 'text-primary' : 'text-foreground'}`}>
            {track.title}
          </h3>
          {showArtist && (
            <p className="text-muted-foreground text-sm truncate">{track.artist}</p>
          )}
        </div>
      </Link>
      
      {/* Duration */}
      <div className="text-muted-foreground text-sm tabular-nums">
        {track.duration ? formatDuration(track.duration) : '0:00'}
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          onClick={handleAddToQueue}
          size="icon"
          variant="ghost"
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleLikeClick}
          size="icon"
          variant="ghost"
          className="h-8 w-8"
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-secondary text-secondary' : ''}`} />
        </Button>
      </div>
    </div>
  );
}