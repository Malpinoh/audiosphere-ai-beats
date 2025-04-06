
import { useState } from "react";
import { Link } from "react-router-dom";
import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtistCardProps {
  id: string;
  name: string;
  image: string;
  followers?: number;
  tracks?: number;
}

export function ArtistCard({ id, name, image, followers, tracks }: ArtistCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  
  const toggleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFollowing(!isFollowing);
  };
  
  const formatFollowers = (count?: number) => {
    if (!count) return "";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M followers`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K followers`;
    }
    return `${count} followers`;
  };
  
  return (
    <Link to={`/artist/${id}`} className="block group">
      <div className="maudio-card overflow-hidden text-center">
        <div className="relative pt-5">
          <div className="mx-auto h-28 w-28 rounded-full overflow-hidden border-4 border-maudio-purple/20">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-base truncate">{name}</h3>
          <div className="flex flex-col items-center gap-2 mt-2">
            {followers !== undefined && (
              <span className="text-xs text-muted-foreground">{formatFollowers(followers)}</span>
            )}
            {tracks !== undefined && (
              <span className="text-xs text-muted-foreground">{tracks} tracks</span>
            )}
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "secondary"}
              className={`w-full gap-1 mt-1 ${isFollowing ? 'border-primary text-primary' : 'maudio-gradient-bg'}`}
              onClick={toggleFollow}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Follow</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
