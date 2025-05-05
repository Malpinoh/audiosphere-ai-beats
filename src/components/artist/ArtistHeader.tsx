
import { Heart, Users, Music, Share, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Artist } from "@/hooks/use-artist";

interface ArtistHeaderProps {
  artist: Artist;
  isFollowing: boolean;
  followLoading: boolean;
  handleToggleFollow: () => Promise<void>;
  getAvatarImage: () => string;
  tracksCount: number;
}

export const ArtistHeader = ({
  artist,
  isFollowing,
  followLoading,
  handleToggleFollow,
  getAvatarImage,
  tracksCount
}: ArtistHeaderProps) => {
  return (
    <div className="relative h-[300px] overflow-hidden bg-maudio-darker">
      {/* Cover Image - Using a gradient as fallback */}
      <div className="absolute inset-0 opacity-40">
        {/* Use a placeholder gradient if no image */}
        <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-maudio-dark via-transparent to-transparent"></div>
      
      {/* Artist Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-6">
        <Avatar className="h-32 w-32 rounded-full border-4 border-white/10">
          <img src={getAvatarImage()} alt={artist.full_name} />
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl md:text-4xl font-bold">{artist.full_name}</h1>
            {artist.is_verified && (
              <span className="bg-blue-500 text-white text-xs rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {artist.follower_count.toLocaleString()} followers
            </span>
            <span className="flex items-center gap-1">
              <Music className="h-4 w-4" />
              {tracksCount} tracks
            </span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          {tracksCount > 0 && (
            <Button className="gap-2 maudio-gradient-bg">
              <Play className="h-4 w-4" />
              Play All
            </Button>
          )}
          <Button 
            variant={isFollowing ? "outline" : "default"}
            className={`gap-2 ${isFollowing ? "border-primary text-primary" : "maudio-gradient-bg"}`}
            onClick={handleToggleFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Heart className="h-4 w-4" fill={isFollowing ? "currentColor" : "none"} />
            )}
            {isFollowing ? "Following" : "Follow"}
          </Button>
          <Button variant="outline" size="icon">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Missing 'Play' component, adding it here:
import { Play } from "lucide-react";
