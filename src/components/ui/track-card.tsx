
import React from "react";
import { Play, Pause, Heart, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/music-player";
import { Link } from "react-router-dom";
import { Track } from "@/types/track-types";
import { toast } from "sonner";

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
    <div className="maudio-card overflow-hidden group">
      <Link to={`/track/${track.id}`} className="block">
        <div className="relative aspect-square bg-maudio-darker">
          <img 
            src={track.cover_art_path 
              ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}` 
              : 'https://picsum.photos/300/300'
            } 
            alt={track.title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://picsum.photos/300/300';
            }}
          />
          
          {!hidePlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              {!hasAudioUrl ? (
                <div className="bg-primary/90 h-12 w-12 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5" />
                </div>
              ) : (
                <Button 
                  onClick={handlePlayClick}
                  className="rounded-full bg-primary/90 hover:bg-primary h-12 w-12 flex items-center justify-center"
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
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={handleAddToQueue}
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
            >
              <Plus className="h-4 w-4 text-white" />
            </Button>
            <Button
              onClick={handleLikeClick}
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-secondary text-secondary' : 'text-white'}`} />
            </Button>
          </div>
        </div>
        
        <div className="p-3 space-y-1">
          <h3 className="font-medium truncate text-sm">{track.title}</h3>
          {showArtist && (
            <p className="text-muted-foreground text-xs truncate">{track.artist}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
