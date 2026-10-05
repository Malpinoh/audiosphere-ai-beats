
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import MainLayout from "@web/components/layout/MainLayout";
import { useArtistProfile } from "@web/hooks/use-artist-profile";
import { useArtistTracks } from "@web/hooks/use-artist-tracks";
import { ArtistHeader } from "@web/components/artist/ArtistHeader";
import { ArtistMobileActions } from "@web/components/artist/ArtistMobileActions";
import { ArtistTabs } from "@web/components/artist/ArtistTabs";
import { ArtistStatsDisplay } from "@web/components/artist/ArtistStatsDisplay";
import { ArtistLoadingState } from "@web/components/artist/ArtistLoadingState";
import { ArtistNotFound } from "@web/components/artist/ArtistNotFound";
import { ArtistClaimModal } from "@web/components/artist/ArtistClaimModal";
import { useIsMobile } from "@web/hooks/use-mobile";
import { useAuth } from "@web/contexts/AuthContext";
import { Button } from "@web/components/ui/button";
import { Crown, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@shared/integrations/supabase/client";
import { useManagedArtists } from "@web/hooks/use-artist-account";

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
  const { managed } = useManagedArtists();
  const isManager = !!artistProfile && managed.some((m) => m.artist_profile_id === artistProfile.id);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !artistProfile?.id) { setClaimStatus(null); return; }
    (supabase.rpc as any)("my_artist_claim_status", { _artist_profile_id: artistProfile.id })
      .then(({ data, error }: any) => { if (error) console.error(error); setClaimStatus(data ?? null); });
  }, [user, artistProfile?.id]);

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
        tracks={tracks as any}
      />
      
      {/* Claim / manage banner */}
      {isManager ? (
        <div className="mx-3 md:mx-4 mb-3 md:mb-4 flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/10 p-3 md:p-4">
          <p className="text-sm font-medium">You manage this artist page</p>
          <Button asChild size="sm"><Link to="/artist-dashboard"><Settings2 className="h-4 w-4 mr-1" />Manage Artist Page</Link></Button>
        </div>
      ) : claimStatus === "pending" ? (
        <div className="mx-3 md:mx-4 mb-3 md:mb-4 rounded-md border border-border bg-muted/40 p-3 md:p-4">
          <p className="text-sm font-medium">Claim under review</p>
          <p className="text-xs text-muted-foreground">We'll let you know once MAUDIO has reviewed your evidence.</p>
        </div>
      ) : claimStatus === "rejected" ? (
        <div className="mx-3 md:mx-4 mb-3 md:mb-4 rounded-md border border-border bg-muted/40 p-3 md:p-4">
          <p className="text-sm font-medium">Your claim wasn't approved</p>
          <p className="text-xs text-muted-foreground">Contact MAUDIO support if you believe this is a mistake.</p>
        </div>
      ) : canClaimProfile() && (
        <div className="bg-accent/20 border-l-4 border-primary p-3 md:p-4 mx-3 md:mx-4 mb-3 md:mb-4 rounded-r-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center min-w-0">
              <Crown className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Are you this artist?</p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Claim this page to manage your profile, images and dashboard.
                </p>
              </div>
            </div>
            <Button onClick={() => setClaimModalOpen(true)} size="sm" className="flex-shrink-0">
              <Crown className="h-4 w-4 mr-1" />
              Claim this Artist Page
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
        tracks={tracks as any}
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
