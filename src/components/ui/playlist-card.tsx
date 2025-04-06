
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaylistCardProps {
  id: string;
  title: string;
  description?: string;
  cover: string;
  trackCount: number;
  createdBy?: {
    name: string;
    id: string;
  };
}

export function PlaylistCard({ 
  id, 
  title, 
  description, 
  cover, 
  trackCount, 
  createdBy 
}: PlaylistCardProps) {
  return (
    <Link to={`/playlist/${id}`} className="block group">
      <div className="maudio-card overflow-hidden">
        <div className="relative">
          <img
            src={cover}
            alt={title}
            className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button 
              size="icon"
              className="h-12 w-12 rounded-full bg-secondary/90 hover:bg-secondary text-white"
            >
              <Play className="h-6 w-6 ml-0.5" />
            </Button>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm truncate">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
          <div className="flex justify-between items-center mt-2">
            {createdBy ? (
              <Link 
                to={`/artist/${createdBy.id}`} 
                className="text-xs text-muted-foreground hover:text-primary truncate"
                onClick={(e) => e.stopPropagation()}
              >
                By {createdBy.name}
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">MAUDIO Playlist</span>
            )}
            <span className="text-xs text-muted-foreground">{trackCount} tracks</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
