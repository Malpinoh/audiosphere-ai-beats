import React from "react";
import { Play, Pause, Heart, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/music-player";
import { Link } from "react-router-dom";
import { Track } from "@/types/track-types";
import { toast } from "sonner";
import { formatDuration } from "@/utils/formatTime";
import { supabase } from "@/integrations/supabase/client";

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
    if (!path) return '/placeholder.svg';
    if (path.startsWith('http')) return path;
    // Build the actual Supabase storage URL
    const { data } = supabase.storage.from('cover_art').getPublicUrl(path);
    return data?.publicUrl || '/placeholder.svg';
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

  const coverUrl = getCoverUrl(track.cover_art_path || track.cover);

  // Card variant - large artwork with overlay
  if (variant === "card") {
    return (
      <Link to={`/track/${track.id}`} className="group block">
        <div className="relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
          {/* Cover Art */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img 
              src={coverUrl} 
              alt={track.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Play button overlay */}
            {!hidePlay && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                {!hasAudioUrl ? (
                  <div className="h-12 w-12 rounded-full bg-muted/80 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                ) : (
                  <Button 
                    onClick={handlePlayClick}
                    className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 hover:scale-110 transition-all duration-200 shadow-lg shadow-primary/30"
                    size="icon"
                  >
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                onClick={handleAddToQueue}
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border-0"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={handleLikeClick}
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border-0"
              >
                <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-secondary text-secondary' : ''}`} />
              </Button>
            </div>

            {/* Duration badge */}
            {track.duration && track.duration > 0 && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium text-white">
                {formatDuration(track.duration)}
              </div>
            )}
          </div>
          
          {/* Track info */}
          <div className="p-3">
            <h3 className={`font-semibold truncate text-sm ${isCurrentTrack ? 'text-primary' : 'text-foreground'}`}>
              {track.title}
            </h3>
            {showArtist && (
              <p className="text-muted-foreground text-xs truncate mt-0.5">{track.artist}</p>
            )}
            {track.genre && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
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
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
      <Link to={`/track/${track.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        {/* Small cover art */}
        <div className="relative flex-shrink-0">
          <img 
            src={coverUrl}
            alt={track.title} 
            className="w-12 h-12 rounded-lg object-cover shadow-sm bg-muted"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          
          {!hidePlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              {!hasAudioUrl ? (
                <AlertCircle className="h-4 w-4 text-white" />
              ) : (
                <Button 
                  onClick={handlePlayClick}
                  className="h-7 w-7 p-0 bg-primary/90 hover:bg-primary rounded-full"
                  size="icon"
                >
                  {isCurrentTrack && isPlaying ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5 ml-0.5" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Track info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate text-sm ${isCurrentTrack ? 'text-primary' : 'text-foreground'}`}>
            {track.title}
          </h3>
          {showArtist && (
            <p className="text-muted-foreground text-xs truncate">{track.artist}</p>
          )}
        </div>
      </Link>
      
      {/* Duration */}
      <div className="text-muted-foreground text-xs tabular-nums hidden sm:block">
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
