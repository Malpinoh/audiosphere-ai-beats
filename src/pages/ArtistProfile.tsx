
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
import { ArtistClaimModal } from "@/components/artist/ArtistClaimModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useState } from "react";

const ArtistProfile = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  
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

  const canClaimProfile = () => {
    return user && artistProfile?.claimable && artistProfile?.auto_created && artistProfile.id !== user.id;
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
      
      {/* Claim Profile Banner */}
      {canClaimProfile() && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 mx-4 mb-4 rounded-r-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Is this your artist profile?
                </p>
                <p className="text-xs text-yellow-700">
                  This profile was automatically created. Claim it to manage your music and profile.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setClaimModalOpen(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              size="sm"
            >
              <Crown className="h-4 w-4 mr-1" />
              Claim Profile
            </Button>
          </div>
        </div>
      )}
      
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

      {/* Claim Modal */}
      <ArtistClaimModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        artistName={artistProfile.username || artistProfile.full_name || 'Unknown Artist'}
        artistProfileId={artistProfile.id}
      />
    </MainLayout>
  );
};

export default ArtistProfile;
