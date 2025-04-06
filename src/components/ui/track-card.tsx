
import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Heart, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackCardProps {
  id: string;
  title: string;
  artist: string;
  cover: string;
  plays?: number;
  artistId: string;
}

export function TrackCard({ id, title, artist, cover, plays, artistId }: TrackCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPlaying(!isPlaying);
  };
  
  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLiked(!isLiked);
  };
  
  const formatPlays = (count?: number) => {
    if (!count) return "";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M plays`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K plays`;
    }
    return `${count} plays`;
  };
  
  return (
    <Link to={`/track/${id}`} className="block group">
      <div className="maudio-card overflow-hidden">
        <div className="relative">
          <img
            src={cover}
            alt={title}
            className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button 
              onClick={togglePlay}
              size="icon"
              className="h-12 w-12 rounded-full bg-primary/90 hover:bg-primary text-white"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </Button>
          </div>
          <div className="absolute bottom-2 right-2 flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 bg-black/60 text-white hover:bg-black/80"
              onClick={toggleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-secondary text-secondary' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 bg-black/60 text-white hover:bg-black/80"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm truncate">{title}</h3>
          <div className="flex justify-between items-center mt-1">
            <Link 
              to={`/artist/${artistId}`} 
              className="text-xs text-muted-foreground hover:text-primary truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {artist}
            </Link>
            {plays !== undefined && (
              <span className="text-xs text-muted-foreground">{formatPlays(plays)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
