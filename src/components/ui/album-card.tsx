import React from "react";
import { Play, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/music-player";
import { Link } from "react-router-dom";
import { Track } from "@/types/track-types";

interface AlbumCardProps {
  albumName: string;
  artistName: string;
  tracks: Track[];
  coverArt: string;
  type: 'album' | 'ep';
  releaseDate?: string;
}

export function AlbumCard({ 
  albumName, 
  artistName, 
  tracks, 
  coverArt, 
  type,
  releaseDate 
}: AlbumCardProps) {
  const { setQueue, playTrack } = useMusicPlayer();

  const handlePlayAlbum = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Sort tracks by track number for correct album order
    const sortedTracks = [...tracks].sort((a, b) => (a.track_number || 0) - (b.track_number || 0));
    setQueue(sortedTracks);
    if (sortedTracks.length > 0) {
      playTrack(sortedTracks[0]);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
  const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();

  return (
    <Link to={`/album/${encodeURIComponent(albumName)}`} className="block group">
      <div className="maudio-card overflow-hidden">
        <div className="relative aspect-square bg-maudio-darker">
          <img 
            src={coverArt} 
            alt={albumName} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://picsum.photos/300/300';
            }}
          />
          
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              onClick={handlePlayAlbum}
              className="rounded-full bg-primary/90 hover:bg-primary h-12 w-12 flex items-center justify-center"
              size="icon"
            >
              <Play className="h-5 w-5 ml-0.5" />
            </Button>
          </div>
        </div>
        
        <div className="p-3 space-y-1">
          <h3 className="font-medium truncate text-sm">{albumName}</h3>
          <p className="text-muted-foreground text-xs truncate">{artistName}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{year}</span>
            <span>•</span>
            <span className="capitalize">{type}</span>
            <span>•</span>
            <span>{tracks.length} tracks</span>
            {totalDuration > 0 && (
              <>
                <span>•</span>
                <span>{formatDuration(totalDuration)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}