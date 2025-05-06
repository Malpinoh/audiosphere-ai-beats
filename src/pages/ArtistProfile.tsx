
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { useTracks } from "@/hooks/use-tracks";
import { useArtist } from "@/hooks/use-artist";
import { ArtistHeader } from "@/components/artist/ArtistHeader";
import { ArtistMobileActions } from "@/components/artist/ArtistMobileActions";
import { ArtistTabs } from "@/components/artist/ArtistTabs";
import { ArtistLoadingState } from "@/components/artist/ArtistLoadingState";
import { ArtistNotFound } from "@/components/artist/ArtistNotFound";
import { useIsMobile } from "@/hooks/use-mobile";

const ArtistProfile = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const isMobile = useIsMobile();
  
  // Use our custom hooks
  const { 
    artist, 
    loading, 
    isFollowing, 
    followLoading, 
    handleToggleFollow,
    getAvatarImage
  } = useArtist(artistId);
  
  // Fetch tracks by this artist
  const { tracks, loading: tracksLoading } = useTracks({
    published: true,
    artist: artist?.full_name || "",
    orderBy: { column: "play_count", ascending: false }
  });

  if (loading) {
    return (
      <MainLayout>
        <ArtistLoadingState />
      </MainLayout>
    );
  }
  
  if (!artist) {
    return (
      <MainLayout>
        <ArtistNotFound />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Artist Header */}
      <ArtistHeader 
        artist={artist}
        isFollowing={isFollowing}
        followLoading={followLoading}
        handleToggleFollow={handleToggleFollow}
        getAvatarImage={getAvatarImage}
        tracksCount={tracks.length}
      />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <ArtistMobileActions 
          isFollowing={isFollowing}
          followLoading={followLoading}
          handleToggleFollow={handleToggleFollow}
          tracksCount={tracks.length}
        />
        
        <ArtistTabs 
          artist={artist}
          tracks={tracks}
          tracksLoading={tracksLoading}
          isMobile={isMobile}
        />
      </div>
    </MainLayout>
  );
};

export default ArtistProfile;
