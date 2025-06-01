
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { useArtistProfile } from "@/hooks/use-artist-profile";
import { useArtistTracks } from "@/hooks/use-artist-tracks";
import { ArtistHeader } from "@/components/artist/ArtistHeader";
import { ArtistMobileActions } from "@/components/artist/ArtistMobileActions";
import { ArtistTabs } from "@/components/artist/ArtistTabs";
import { ArtistStatsDisplay } from "@/components/artist/ArtistStatsDisplay";
import { ArtistLoadingState } from "@/components/artist/ArtistLoadingState";
import { ArtistNotFound } from "@/components/artist/ArtistNotFound";
import { useIsMobile } from "@/hooks/use-mobile";

const ArtistProfile = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const isMobile = useIsMobile();
  
  const { 
    artistProfile, 
    loading, 
    isFollowing, 
    followLoading, 
    toggleFollow
  } = useArtistProfile(artistId);
  
  const { tracks, loading: tracksLoading } = useArtistTracks(artistId || '');

  const getAvatarImage = () => {
    if (artistProfile?.avatar_url) return artistProfile.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(artistProfile?.full_name || "Artist")}&background=random`;
  };

  if (loading) {
    return (
      <MainLayout>
        <ArtistLoadingState />
      </MainLayout>
    );
  }
  
  if (!artistProfile) {
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
        artist={artistProfile}
        isFollowing={isFollowing}
        followLoading={followLoading}
        handleToggleFollow={toggleFollow}
        getAvatarImage={getAvatarImage}
        tracksCount={tracks.length}
      />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <ArtistMobileActions 
          isFollowing={isFollowing}
          followLoading={followLoading}
          handleToggleFollow={toggleFollow}
          tracksCount={tracks.length}
        />
        
        <ArtistStatsDisplay artistId={artistProfile.id} />
        
        <ArtistTabs 
          artist={artistProfile}
          tracks={tracks}
          tracksLoading={tracksLoading}
          isMobile={isMobile}
        />
      </div>
    </MainLayout>
  );
};

export default ArtistProfile;
