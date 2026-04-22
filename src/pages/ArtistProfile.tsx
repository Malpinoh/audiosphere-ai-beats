
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
  const { artistSlug } = useParams<{ artistSlug: string }>();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  
  const { 
    artistProfile, 
    loading, 
    isFollowing, 
    followLoading, 
    toggleFollow
  } = useArtistProfile(artistSlug);
  
  const { tracks, loading: tracksLoading } = useArtistTracks(artistProfile?.id || '');

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
      <Helmet>
        <title>{`${artistProfile.full_name || artistProfile.username || "Artist"} · Maudio`}</title>
        <meta name="description" content={`Discover music by ${artistProfile.full_name || artistProfile.username || "this artist"} on Maudio`} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={artistProfile.full_name || artistProfile.username || "Artist"} />
        <meta property="og:description" content={`Discover music by ${artistProfile.full_name || artistProfile.username || "this artist"} on Maudio`} />
        <meta property="og:image" content={getAvatarImage()} />
        <meta property="og:url" content={`https://maudio.online/artist/${artistSlug || artistProfile.id}`} />
        <meta property="og:site_name" content="Maudio" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={getAvatarImage()} />
        <link rel="canonical" href={`https://maudio.online/artist/${artistSlug || artistProfile.id}`} />
      </Helmet>
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
        <div className="bg-accent/20 border-l-4 border-primary p-3 md:p-4 mx-3 md:mx-4 mb-3 md:mb-4 rounded-r-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center min-w-0">
              <Crown className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Is this your artist profile?
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  This profile was automatically created. Claim it to manage your music and profile.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setClaimModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
              size="sm"
            >
              <Crown className="h-4 w-4 mr-1" />
              Claim
            </Button>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <ArtistMobileActions 
          isFollowing={isFollowing}
          followLoading={followLoading}
          handleToggleFollow={toggleFollow}
          tracksCount={tracks.length}
          artistId={artistProfile.id}
          artistName={artistProfile.full_name || artistProfile.username || undefined}
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
        onClaimed={() => {
          window.location.reload();
        }}
      />
    </MainLayout>
  );
};

export default ArtistProfile;
