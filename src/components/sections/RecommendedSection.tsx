
import React from "react";
import { Link } from "react-router-dom";
import { ArtistCard } from "@/components/ui/artist-card";
import { PlaylistCard } from "@/components/ui/playlist-card";
import { Section } from "@/components/sections/FeaturedSection";
import { useTracks } from "@/hooks/use-tracks";
import { Track } from "@/types/track-types";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const LoadingCard = () => (
  <div className="min-w-[220px] max-w-[220px]">
    <div className="maudio-card overflow-hidden">
      <Skeleton className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
);

interface RealArtist {
  id: string;
  name: string;
  image: string;
  followers: number;
  tracks: number;
  isVerified?: boolean;
}

// Hook to fetch real artists with follower counts
function useRealArtists() {
  const [artists, setArtists] = useState<RealArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealArtists = async () => {
      try {
        // Get artists with their follower counts and track counts
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            full_name,
            avatar_url,
            follower_count,
            is_verified,
            role
          `)
          .eq('role', 'artist')
          .order('follower_count', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Get track counts for each artist
        const artistsWithTracks = await Promise.all(
          (profiles || []).map(async (profile) => {
            const { count } = await supabase
              .from('tracks')
              .select('*', { count: 'exact', head: true })
              .or(`artist.eq.${profile.username},artist.eq.${profile.full_name}`)
              .eq('published', true);

            return {
              id: profile.id,
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

// Hook to fetch real playlists
function useRealPlaylists() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealPlaylists = async () => {
      try {
        const { data: playlistsData, error } = await supabase
          .from('playlists')
          .select(`
            id,
            title,
            description,
            cover_image_path,
            is_editorial,
            created_by,
            profiles!playlists_created_by_fkey(username, full_name)
          `)
          .eq('is_editorial', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        // Get track counts for each playlist
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
              cover: playlist.cover_image_path || "https://picsum.photos/id/1062/300/300",
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
        // Fallback to editorial playlists
        setPlaylists([
          {
            id: "editorial-1",
            title: "Today's Hits",
            description: "The hottest tracks right now",
            cover: "https://picsum.photos/id/1062/300/300",
            trackCount: 25,
            createdBy: { name: "MAUDIO Editorial", id: "editorial" }
          }
        ]);
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
  
  if (loading) {
    return (
      <Section 
        title="Trending Artists" 
        subtitle="Artists with the most followers"
        seeAllLink="/artists/trending"
      >
        {Array(5).fill(0).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </Section>
    );
  }
  
  return (
    <Section 
      title="Trending Artists" 
      subtitle="Artists with the most followers"
      seeAllLink="/artists/trending"
    >
      {artists.slice(0, 5).map(artist => (
        <div key={artist.id} className="min-w-[220px] max-w-[220px]">
          <ArtistCard {...artist} />
        </div>
      ))}
    </Section>
  );
}

export function FeaturedPlaylists() {
  const { playlists, loading } = useRealPlaylists();

  if (loading) {
    return (
      <Section 
        title="Featured Playlists" 
        subtitle="Curated by MAUDIO Editorial"
        seeAllLink="/playlists"
      >
        {Array(5).fill(0).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </Section>
    );
  }

  return (
    <Section 
      title="Featured Playlists" 
      subtitle="Curated by MAUDIO Editorial"
      seeAllLink="/playlists"
    >
      {playlists.map(playlist => (
        <div key={playlist.id} className="min-w-[220px] max-w-[220px]">
          <PlaylistCard {...playlist} />
        </div>
      ))}
    </Section>
  );
}

export function PersonalizedRecommendations() {
  const { artists, loading } = useRealArtists();
  
  if (loading) {
    return (
      <Section 
        title="Recommended for You" 
        subtitle="Based on popular artists"
        seeAllLink="/recommendations"
      >
        {Array(5).fill(0).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </Section>
    );
  }
  
  // Show top artists by follower count
  const recommendedArtists = artists
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 5);
  
  return (
    <Section 
      title="Recommended for You" 
      subtitle="Based on popular artists"
      seeAllLink="/recommendations"
    >
      {recommendedArtists.map(artist => (
        <div key={artist.id} className="min-w-[220px] max-w-[220px]">
          <ArtistCard {...artist} />
        </div>
      ))}
    </Section>
  );
}
