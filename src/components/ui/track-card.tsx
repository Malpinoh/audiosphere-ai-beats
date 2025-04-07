
import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Heart, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface TrackCardProps {
  id: string;
  title: string;
  artist: string;
  cover: string;
  plays?: number;
  artistId: string;
}

export function TrackCard({ id, title, artist, cover, plays, artistId }: TrackCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusicPlayer();
  
  const isCurrentTrack = currentTrack?.id === id;
  
  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack({
        id,
        title,
        artist,
        cover_art_path: cover,
        audio_file_path: '', // This will be set by the backend
        genre: '',
        mood: '',
        play_count: plays || 0,
        like_count: 0,
        tags: [],
        published: true,
        // Add additional required fields for the Track type
        cover,
        audioUrl: `/api/stream/${id}`, // This will be updated by the hooks
      });
    }
  };
  
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div className="block group">
      <div className="maudio-card overflow-hidden">
        <div className="relative">
          <Link to={`/track/${id}`}>
            <img
              src={cover}
              alt={title}
              className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button 
              onClick={handlePlayClick}
              size="icon"
              className="h-12 w-12 rounded-full bg-primary/90 hover:bg-primary text-white"
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </Button>
          </div>
          <div className="absolute bottom-2 right-2 flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 bg-black/60 text-white hover:bg-black/80"
              onClick={handleLikeClick}
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
          <Link to={`/track/${id}`} className="block">
            <h3 className="font-medium text-sm truncate hover:text-primary">{title}</h3>
          </Link>
          <div className="flex justify-between items-center mt-1">
            <Link 
              to={`/artist/${artistId}`} 
              className="text-xs text-muted-foreground hover:text-primary truncate"
            >
              {artist}
            </Link>
            {plays !== undefined && (
              <span className="text-xs text-muted-foreground">{formatPlays(plays)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
