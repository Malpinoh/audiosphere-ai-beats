
import React from "react";
import { Play, Pause, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Link } from "react-router-dom";
import { Track } from "@/hooks/use-tracks";

interface TrackCardProps {
  track: Track;
  showArtist?: boolean;
  hidePlay?: boolean;
}

export function TrackCard({ track, showArtist = true, hidePlay = false }: TrackCardProps) {
  const { playTrack, togglePlay, currentTrack, isPlaying } = useMusicPlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  
  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };
  
  return (
    <div className="maudio-card overflow-hidden group">
      <Link to={`/track/${track.id}`} className="block">
        <div className="relative aspect-square bg-maudio-darker">
          <img 
            src={track.cover || track.cover_art_path} 
            alt={track.title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          
          {!hidePlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>
          )}
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
