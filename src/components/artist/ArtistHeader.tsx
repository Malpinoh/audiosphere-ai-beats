
import { Heart, Users, Music, Share, Loader2, CheckCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ArtistProfile } from "@/hooks/use-artist-profile";

interface ArtistHeaderProps {
  artist: ArtistProfile;
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
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="relative h-[260px] md:h-[400px] overflow-hidden bg-gradient-to-br from-primary/30 via-primary/20 to-accent/30">
      {/* Background blur effect */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm"></div>
      
      {/* Artist Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        {/* Mobile: stacked center layout */}
        <div className="flex flex-col items-center text-center md:flex-row md:items-end md:text-left gap-3 md:gap-6">
          <div className="relative flex-shrink-0">
            <Avatar className="h-20 w-20 md:h-32 md:w-32 rounded-full border-4 border-border/30 shadow-2xl">
              <img src={getAvatarImage()} alt={artist.full_name} className="object-cover" />
            </Avatar>
            {artist.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 md:p-2 border-2 border-background">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-1 md:mb-2">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground truncate">{artist.full_name}</h1>
              {artist.is_verified && (
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
              )}
            </div>
            
            {artist.username && (
              <p className="text-sm md:text-lg text-muted-foreground mb-2 md:mb-3">@{artist.username}</p>
            )}
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-6 text-sm md:text-base text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {formatFollowers(artist.follower_count)} followers
              </span>
              <span className="flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {tracksCount} tracks
              </span>
              <span className="text-xs md:text-sm">
                {formatFollowers(artist.monthly_listeners || 0)} monthly listeners
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            {tracksCount > 0 && (
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-full font-semibold">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play All
              </Button>
            )}
            <Button 
              variant={isFollowing ? "outline" : "default"}
              className={`gap-2 px-6 py-3 rounded-full font-semibold ${
                isFollowing 
                  ? "border-border text-foreground hover:bg-muted" 
                  : "bg-transparent border-2 border-foreground text-foreground hover:bg-foreground hover:text-background"
              }`}
              onClick={handleToggleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className="h-4 w-4" fill={isFollowing ? "currentColor" : "none"} />
              )}
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button variant="outline" size="icon" className="rounded-full border-border text-foreground hover:bg-muted">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
