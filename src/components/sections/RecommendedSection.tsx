import React, { useState, useEffect } from "react";
import { ArtistCard } from "@/components/ui/artist-card";
import { PlaylistCard } from "@/components/ui/playlist-card";
import { TrackCard } from "@/components/ui/track-card";
import { Section } from "@/components/sections/FeaturedSection";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { usePersonalizedRecommendations } from "@/hooks/use-recommendations";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

// Compact mobile artist row
function ArtistListItem({ id, slug, name, image, followers, isVerified }: { id: string; slug?: string; name: string; image: string; followers?: number; isVerified?: boolean }) {
  const formatFollowers = (count?: number) => {
    if (!count) return "";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return `${count}`;
  };

  return (
    <Link to={`/artist/${slug || id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
      <img
        src={image}
        alt={name}
        className="w-12 h-12 rounded-full object-cover bg-muted flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff&size=200`;
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium text-sm truncate text-foreground">{name}</span>
          {isVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
        </div>
        {followers !== undefined && followers > 0 && (
          <p className="text-xs text-muted-foreground">{formatFollowers(followers)} followers</p>
        )}
      </div>
    </Link>
  );
}

// Compact mobile playlist row
function PlaylistListItem({ id, title, description, cover, trackCount }: { id: string; title: string; description?: string; cover: string; trackCount: number }) {
  return (
    <Link to={`/playlist/${id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
      <img
        src={cover}
        alt={title}
        className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
      />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block text-foreground">{title}</span>
        <p className="text-xs text-muted-foreground truncate">{trackCount} tracks</p>
      </div>
    </Link>
  );
}

const LoadingCard = ({ isMobile }: { isMobile: boolean }) => {
  if (isMobile) {
    return (
      <div className="flex items-center gap-3 p-2">
        <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="min-w-[180px] max-w-[180px] snap-start">
      <div className="rounded-xl overflow-hidden bg-card">
        <Skeleton className="w-full aspect-square" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
};

interface RealArtist {
  id: string;
  slug?: string;
  name: string;
  image: string;
  followers: number;
  tracks: number;
  isVerified?: boolean;
}

function useRealArtists() {
  const [artists, setArtists] = useState<RealArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealArtists = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, follower_count, is_verified, slug, role')
          .eq('role', 'artist')
          .order('follower_count', { ascending: false })
          .limit(10);

        if (error) throw error;

        const artistsWithTracks = await Promise.all(
          (profiles || []).map(async (profile) => {
            const { count } = await supabase
              .from('tracks')
              .select('*', { count: 'exact', head: true })
              .or(`artist.eq.${profile.username},artist.eq.${profile.full_name}`)
              .eq('published', true);

            return {
              id: profile.id,
              slug: profile.slug || undefined,
              name: profile.full_name || profile.username || 'Unknown Artist',
              image: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username || 'Artist')}&background=random`,
              followers: profile.follower_count || 0,
              tracks: count || 0,
              isVerified: profile.is_verified || false
            };
          })
        );

        setArtists(artistsWithTracks.filter(artist => artist.tracks > 0));
      } catch (error) {
        console.error('Error fetching real artists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealArtists();
  }, []);

  return { artists, loading };
}

function useRealPlaylists() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealPlaylists = async () => {
      try {
        const { data: playlistsData, error } = await supabase
          .from('playlists')
          .select(`id, title, description, cover_image_path, is_editorial, created_by, profiles!playlists_created_by_fkey(username, full_name)`)
          .eq('is_editorial', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const playlistsWithCounts = await Promise.all(
          (playlistsData || []).map(async (playlist) => {
            const { count } = await supabase
              .from('playlist_tracks')
              .select('*', { count: 'exact', head: true })
              .eq('playlist_id', playlist.id);

            return {
              id: playlist.id,
              title: playlist.title,
              description: playlist.description,
              cover: playlist.cover_image_path 
                ? (playlist.cover_image_path.startsWith('http') 
                    ? playlist.cover_image_path 
                    : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${playlist.cover_image_path}`)
                : "https://picsum.photos/id/1062/300/300",
              trackCount: count || 0,
              createdBy: {
                name: playlist.profiles?.full_name || playlist.profiles?.username || "MAUDIO Editorial",
                id: playlist.created_by || "editorial"
              }
            };
          })
        );

        setPlaylists(playlistsWithCounts);
      } catch (error) {
        console.error('Error fetching real playlists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealPlaylists();
  }, []);

  return { playlists, loading };
}

export function TrendingArtists() {
  const { artists, loading } = useRealArtists();
  const isMobile = useIsMobile();
  
  if (loading) {
    return (
      <Section title="Trending Artists" subtitle="Artists with the most followers" seeAllLink="/artists/trending">
        {Array(isMobile ? 5 : 5).fill(0).map((_, i) => (
          <LoadingCard key={i} isMobile={isMobile} />
        ))}
      </Section>
    );
  }
  
  return (
    <Section title="Trending Artists" subtitle="Artists with the most followers" seeAllLink="/artists/trending">
      {artists.slice(0, 6).map(artist => (
        isMobile ? (
          <ArtistListItem key={artist.id} {...artist} />
        ) : (
          <div key={artist.id} className="min-w-[180px] max-w-[180px] snap-start">
            <ArtistCard {...artist} />
          </div>
        )
      ))}
    </Section>
  );
}

export function FeaturedPlaylists() {
  const { playlists, loading } = useRealPlaylists();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <Section title="Featured Playlists" subtitle="Curated by MAUDIO Editorial" seeAllLink="/playlists">
        {Array(isMobile ? 4 : 5).fill(0).map((_, i) => (
          <LoadingCard key={i} isMobile={isMobile} />
        ))}
      </Section>
    );
  }

  return (
    <Section title="Featured Playlists" subtitle="Curated by MAUDIO Editorial" seeAllLink="/playlists">
      {playlists.map(playlist => (
        isMobile ? (
          <PlaylistListItem key={playlist.id} id={playlist.id} title={playlist.title} description={playlist.description} cover={playlist.cover} trackCount={playlist.trackCount} />
        ) : (
          <div key={playlist.id} className="min-w-[180px] max-w-[180px] snap-start">
            <PlaylistCard {...playlist} />
          </div>
        )
      ))}
    </Section>
  );
}

export function PersonalizedRecommendations() {
  const { user } = useAuth();
  const { tracks, loading } = usePersonalizedRecommendations(10);
  const { artists, loading: artistsLoading } = useRealArtists();
  const isMobile = useIsMobile();
  
  const formatTrackForCard = (trackData: any) => ({
    id: trackData.id,
    title: trackData.title,
    artist: trackData.artist,
    cover_art_path: trackData.cover,
    audio_file_path: "",
    genre: trackData.genre || "",
    mood: trackData.mood || "",
    play_count: trackData.plays || 0,
    like_count: 0,
    tags: [],
    published: true,
    cover: trackData.cover,
    user_id: trackData.artistId || "unknown",
    duration: 0
  });

  if (loading || artistsLoading) {
    return (
      <Section title="Recommended for You" subtitle={user ? "Based on your listening history" : "Popular tracks"} seeAllLink="/recommendations">
        {Array(isMobile ? 5 : 5).fill(0).map((_, i) => (
          <LoadingCard key={i} isMobile={isMobile} />
        ))}
      </Section>
    );
  }
  
  if (tracks.length > 0) {
    return (
      <Section title="Recommended for You" subtitle={user ? "Based on your listening history" : "Popular tracks"} seeAllLink="/recommendations">
        {tracks.slice(0, isMobile ? 6 : 6).map(track => (
          isMobile ? (
            <TrackCard key={track.id} track={formatTrackForCard(track)} variant="list" />
          ) : (
            <div key={track.id} className="min-w-[180px] max-w-[180px] snap-start">
              <TrackCard track={formatTrackForCard(track)} variant="card" />
            </div>
          )
        ))}
      </Section>
    );
  }
  
  const recommendedArtists = artists.sort((a, b) => b.followers - a.followers).slice(0, 5);
  
  return (
    <Section title="Recommended for You" subtitle="Popular artists" seeAllLink="/recommendations">
      {recommendedArtists.map(artist => (
        isMobile ? (
          <ArtistListItem key={artist.id} {...artist} />
        ) : (
          <div key={artist.id} className="min-w-[180px] max-w-[180px] snap-start">
            <ArtistCard {...artist} />
          </div>
        )
      ))}
    </Section>
  );
}
