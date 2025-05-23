
import { Play, Heart, Share, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface ArtistMobileActionsProps {
  isFollowing: boolean;
  followLoading: boolean;
  handleToggleFollow: () => Promise<void>;
  tracksCount: number;
}

export const ArtistMobileActions = ({
  isFollowing,
  followLoading,
  handleToggleFollow,
  tracksCount
}: ArtistMobileActionsProps) => {
  const { setQueue, playTrack } = useMusicPlayer();
  
  // This would need actual implementation with the tracks data
  const handlePlayAll = () => {
    // Implementation would depend on the available tracks
    console.log("Play all tracks from this artist");
  };

  return (
    <div className="flex md:hidden items-center gap-2 mb-6">
      {tracksCount > 0 && (
        <Button className="gap-2 maudio-gradient-bg flex-1" onClick={handlePlayAll}>
          <Play className="h-4 w-4" />
          Play All
        </Button>
      )}
      <Button 
        variant={isFollowing ? "outline" : "default"}
        className={`gap-2 flex-1 ${isFollowing ? "border-primary text-primary" : "maudio-gradient-bg"}`}
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
  );
};
