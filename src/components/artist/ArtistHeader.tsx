
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
    <div className="relative h-[400px] overflow-hidden bg-gradient-to-br from-purple-900/80 via-pink-900/60 to-blue-900/80">
      {/* Background blur effect */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      
      {/* Artist Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-6">
        <div className="relative">
          <Avatar className="h-32 w-32 rounded-full border-4 border-white/20 shadow-2xl">
            <img src={getAvatarImage()} alt={artist.full_name} />
          </Avatar>
          {artist.is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-2 border-2 border-white">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white">{artist.full_name}</h1>
            {artist.is_verified && (
              <CheckCircle className="h-6 w-6 text-blue-400" />
            )}
          </div>
          
          {artist.username && (
            <p className="text-lg text-white/80 mb-3">@{artist.username}</p>
          )}
          
          <div className="flex items-center gap-6 text-white/90">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {formatFollowers(artist.follower_count)} followers
            </span>
            <span className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              {tracksCount} tracks
            </span>
            <span className="flex items-center gap-2">
              <span className="text-sm">
                {formatFollowers(artist.monthly_listeners || 0)} monthly listeners
              </span>
            </span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          {tracksCount > 0 && (
            <Button className="gap-2 bg-white text-black hover:bg-white/90 px-8 py-3 rounded-full font-semibold">
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
                ? "border-white/30 text-white hover:bg-white/10" 
                : "bg-transparent border-2 border-white text-white hover:bg-white hover:text-black"
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
          <Button variant="outline" size="icon" className="rounded-full border-white/30 text-white hover:bg-white/10">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
