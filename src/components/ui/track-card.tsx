
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
}

export function TrackCard({ track, showArtist = true, hidePlay = false }: TrackCardProps) {
  const { playTrack, togglePlay, currentTrack, isPlaying, isTrackLiked, likeTrack, unlikeTrack, addToQueue } = useMusicPlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  const hasAudioUrl = track.audioUrl || track.audio_file_path;
  const liked = isTrackLiked(track.id);
  
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
  
  
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group">
      <Link to={`/track/${track.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        {/* Small cover art */}
        <div className="relative flex-shrink-0">
          <img 
            src={track.cover_art_path 
              ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}` 
              : 'https://picsum.photos/300/300'
            } 
            alt={track.title} 
            className="w-12 h-12 rounded object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://picsum.photos/300/300';
            }}
          />
          
          {!hidePlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded">
              {!hasAudioUrl ? (
                <AlertCircle className="h-4 w-4 text-white" />
              ) : (
                <Button 
                  onClick={handlePlayClick}
                  className="h-6 w-6 p-0 bg-primary/90 hover:bg-primary rounded-full"
                  size="icon"
                >
                  {isCurrentTrack && isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3 ml-0.5" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Track info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${isCurrentTrack ? 'text-primary' : 'text-white'}`}>
            {track.title}
          </h3>
          {showArtist && (
            <p className="text-muted-foreground text-sm truncate">{track.artist}</p>
          )}
        </div>
      </Link>
      
      {/* Duration */}
      <div className="text-muted-foreground text-sm">
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
