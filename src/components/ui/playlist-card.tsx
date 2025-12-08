import { Link } from "react-router-dom";
import { Play, Music, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import MAudioLogo from "@/assets/maudio-logo.svg";

interface PlaylistCardProps {
  id: string;
  title: string;
  description?: string;
  cover: string;
  trackCount: number;
  isEditorial?: boolean;
  followerCount?: number;
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
  isEditorial = false,
  followerCount = 0,
  createdBy 
}: PlaylistCardProps) {
  return (
    <Link to={`/playlist/${id}`} className="block group">
      <div className="relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:bg-card/80 hover:shadow-xl hover:shadow-secondary/10 hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={cover}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop";
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Editorial badge */}
          {isEditorial && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1">
              <img 
                src={MAudioLogo} 
                alt="MAUDIO" 
                className="h-3 w-auto"
              />
              <span className="text-xs font-medium">Editorial</span>
            </div>
          )}

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button 
              size="icon"
              className="h-14 w-14 rounded-full bg-secondary hover:bg-secondary/90 hover:scale-110 transition-all duration-200 shadow-lg shadow-secondary/30"
            >
              <Play className="h-6 w-6 ml-1" />
            </Button>
          </div>

          {/* Track count badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium">
            <Music className="h-3 w-3" />
            {trackCount}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-base truncate">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span className="truncate">
              {createdBy ? `By ${createdBy.name}` : 'MAUDIO Playlist'}
            </span>
            {followerCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {followerCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}