
import { Play, Heart, Share, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { shareContent } from "@/lib/share";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

interface ArtistMobileActionsProps {
  isFollowing: boolean;
  followLoading: boolean;
  handleToggleFollow: () => Promise<void>;
  tracksCount: number;
  artistId?: string;
  artistName?: string;
}

export const ArtistMobileActions = ({
  isFollowing,
  followLoading,
  handleToggleFollow,
  tracksCount,
  artistId,
  artistName,
}: ArtistMobileActionsProps) => {
  const { setQueue, playTrack } = useMusicPlayer();
  const { artistSlug } = useParams<{ artistSlug: string }>();
  
  // This would need actual implementation with the tracks data
  const handlePlayAll = () => {
    // Implementation would depend on the available tracks
    console.log("Play all tracks from this artist");
  };

  const handleShare = async () => {
    const id = artistSlug || artistId;
    if (!id) return;
    try {
      await shareContent({
        kind: "artist",
        id,
        title: artistName || "Artist on Maudio",
        text: `Discover music by ${artistName || "this artist"} on Maudio`,
      });
      toast.success("Share link copied");
    } catch {
      toast.error("Could not share");
    }
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
      <Button variant="outline" size="icon" onClick={handleShare}>
        <Share className="h-4 w-4" />
      </Button>
    </div>
  );
};
