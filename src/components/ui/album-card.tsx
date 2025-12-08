import React from "react";
import { Play, Calendar, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/music-player";
import { Link } from "react-router-dom";
import { Track } from "@/types/track-types";
import { formatDuration } from "@/utils/formatTime";

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
    
    const sortedTracks = [...tracks].sort((a, b) => (a.track_number || 0) - (b.track_number || 0));
    setQueue(sortedTracks);
    if (sortedTracks.length > 0) {
      playTrack(sortedTracks[0]);
    }
  };

  const totalDuration = tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
  const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();

  const getCoverUrl = (path: string) => {
    if (!path) return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop';
    if (path.startsWith('http')) return path;
    return path;
  };

  return (
    <Link to={`/album/${encodeURIComponent(albumName)}`} className="block group">
      <div className="relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden">
          <img 
            src={getCoverUrl(coverArt)}
            alt={albumName} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop';
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button 
              onClick={handlePlayAlbum}
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 hover:scale-110 transition-all duration-200 shadow-lg shadow-primary/30"
              size="icon"
            >
              <Play className="h-6 w-6 ml-1" />
            </Button>
          </div>

          {/* Type badge */}
          <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium uppercase">
            {type}
          </div>

          {/* Track count badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium">
            <Music className="h-3 w-3" />
            {tracks.length}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold truncate text-base">{albumName}</h3>
          <p className="text-muted-foreground text-sm truncate mt-1">{artistName}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{year}</span>
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