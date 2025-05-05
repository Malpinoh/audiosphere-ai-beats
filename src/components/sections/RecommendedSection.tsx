
import React from "react";
import { Link } from "react-router-dom";
import { ArtistCard } from "@/components/ui/artist-card";
import { PlaylistCard } from "@/components/ui/playlist-card";
import { Section } from "@/components/sections/FeaturedSection";
import { useTracks } from "@/hooks/use-tracks";
import { Track } from "@/types/track-types";
import { Skeleton } from "@/components/ui/skeleton";

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

const featuredPlaylists = [
  {
    id: "1",
    title: "Chill Vibes",
    description: "Perfect for relaxing and unwinding after a long day",
    cover: "https://picsum.photos/id/1062/300/300",
    trackCount: 25,
    createdBy: {
      name: "MAUDIO Editorial",
      id: "editorial"
    }
  },
  {
    id: "2",
    title: "Workout Beats",
    description: "High energy tracks to power your workout",
    cover: "https://picsum.photos/id/325/300/300",
    trackCount: 32,
    createdBy: {
      name: "MAUDIO Editorial",
      id: "editorial"
    }
  },
  {
    id: "3",
    title: "Focus Flow",
    description: "Concentration-enhancing music for work and study",
    cover: "https://picsum.photos/id/454/300/300",
    trackCount: 40
  },
  {
    id: "4",
    title: "Party Anthems",
    description: "Get the party started with these bangers",
    cover: "https://picsum.photos/id/96/300/300",
    trackCount: 28,
    createdBy: {
      name: "DJ MaxOut",
      id: "dj-maxout"
    }
  },
  {
    id: "5",
    title: "Indie Discoveries",
    description: "The best new indie music you haven't heard yet",
    cover: "https://picsum.photos/id/1080/300/300",
    trackCount: 35
  }
];

const convertTracksToArtists = (tracks: Track[]) => {
  const uniqueArtists = Array.from(new Set(tracks.map(track => track.artist)));
  
  return uniqueArtists.slice(0, 5).map((artistName, index) => {
    const artistTracks = tracks.filter(track => track.artist === artistName);
    
    return {
      id: `artist-${index}`,
      name: artistName,
      image: artistTracks[0].cover || "https://picsum.photos/id/64/300/300",
      followers: Math.floor(Math.random() * 1000000) + 10000,
      tracks: artistTracks.length
    };
  });
};

export function TrendingArtists() {
  const { tracks, loading } = useTracks({ limit: 20 });
  
  if (loading) {
    return (
      <Section 
        title="Trending Artists" 
        subtitle="Who's hot right now"
        seeAllLink="/artists/trending"
      >
        {Array(5).fill(0).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </Section>
    );
  }
  
  const artists = convertTracksToArtists(tracks);
  
  return (
    <Section 
      title="Trending Artists" 
      subtitle="Who's hot right now"
      seeAllLink="/artists/trending"
    >
      {artists.map(artist => (
        <div key={artist.id} className="min-w-[220px] max-w-[220px]">
          <ArtistCard {...artist} />
        </div>
      ))}
    </Section>
  );
}

export function FeaturedPlaylists() {
  return (
    <Section 
      title="Featured Playlists" 
      subtitle="Curated collections for every mood"
      seeAllLink="/playlists"
    >
      {featuredPlaylists.map(playlist => (
        <div key={playlist.id} className="min-w-[220px] max-w-[220px]">
          <PlaylistCard {...playlist} />
        </div>
      ))}
    </Section>
  );
}

export function PersonalizedRecommendations() {
  const { tracks, loading } = useTracks({ limit: 5 });
  
  if (loading) {
    return (
      <Section 
        title="Recommended for You" 
        subtitle="Based on your listening history"
        seeAllLink="/recommendations"
      >
        {Array(5).fill(0).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </Section>
    );
  }
  
  const recommendedArtists = convertTracksToArtists(
    [...tracks].sort((a, b) => b.like_count - a.like_count)
  );
  
  return (
    <Section 
      title="Recommended for You" 
      subtitle="Based on your listening history"
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
