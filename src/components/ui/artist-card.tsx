import { useState } from "react";
import { Link } from "react-router-dom";
import { UserCheck, UserPlus, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtistCardProps {
  id: string;
  slug?: string;
  name: string;
  image: string;
  followers?: number;
  tracks?: number;
  isVerified?: boolean;
}

export function ArtistCard({ id, slug, name, image, followers, tracks, isVerified }: ArtistCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  
  const toggleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFollowing(!isFollowing);
  };
  
  const formatFollowers = (count?: number) => {
    if (!count) return "";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return `${count}`;
  };
  
  return (
    <Link to={`/artist/${slug || id}`} className="block group">
      <div className="relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 text-center p-5">
        {/* Artist Avatar */}
        <div className="relative mx-auto mb-4">
          <div className="h-32 w-32 rounded-full overflow-hidden ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 mx-auto">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff&size=200`;
              }}
            />
          </div>
          
          {/* Verified badge */}
          {isVerified && (
            <div className="absolute bottom-1 right-1/2 translate-x-8 bg-primary rounded-full p-1">
              <BadgeCheck className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        
        {/* Artist info */}
        <h3 className="font-semibold text-base truncate mb-1">{name}</h3>
        
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-4">
          {followers !== undefined && followers > 0 && (
            <span>{formatFollowers(followers)} followers</span>
          )}
          {tracks !== undefined && tracks > 0 && (
            <>
              {followers !== undefined && followers > 0 && <span>•</span>}
              <span>{tracks} tracks</span>
            </>
          )}
        </div>
        
        <Button
          size="sm"
          variant={isFollowing ? "outline" : "default"}
          className={`w-full gap-1.5 ${isFollowing ? 'border-primary/50 text-primary hover:bg-primary/10' : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'}`}
          onClick={toggleFollow}
        >
          {isFollowing ? (
            <>
              <UserCheck className="h-4 w-4" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Follow
            </>
          )}
        </Button>
      </div>
    </Link>
  );
}