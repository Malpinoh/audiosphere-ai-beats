
import React from "react";
import { Link } from "react-router-dom";
import { ArtistCard } from "@/components/ui/artist-card";
import { PlaylistCard } from "@/components/ui/playlist-card";
import { Section } from "@/components/sections/FeaturedSection";

// Mock data for trending artists
const trendingArtists = [
  {
    id: "1",
    name: "Luna Echo",
    image: "https://picsum.photos/id/64/300/300",
    followers: 1248000,
    tracks: 27
  },
  {
    id: "2",
    name: "Stellar Beats",
    image: "https://picsum.photos/id/177/300/300",
    followers: 876000,
    tracks: 43
  },
  {
    id: "3",
    name: "City Sounds",
    image: "https://picsum.photos/id/338/300/300",
    followers: 2450000,
    tracks: 18
  },
  {
    id: "4",
    name: "Nomad Soul",
    image: "https://picsum.photos/id/670/300/300",
    followers: 543000,
    tracks: 35
  },
  {
    id: "5",
    name: "Cyber Pulse",
    image: "https://picsum.photos/id/453/300/300",
    followers: 1789000,
    tracks: 52
  }
];

// Mock data for featured playlists
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

// Trending artists section component
export function TrendingArtists() {
  return (
    <Section 
      title="Trending Artists" 
      subtitle="Who's hot right now"
      seeAllLink="/artists/trending"
    >
      {trendingArtists.map(artist => (
        <div key={artist.id} className="min-w-[220px] max-w-[220px]">
          <ArtistCard {...artist} />
        </div>
      ))}
    </Section>
  );
}

// Featured playlists section component
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

// Personalized recommendations section component for home page
export function PersonalizedRecommendations() {
  return (
    <Section 
      title="Recommended for You" 
      subtitle="Based on your listening history"
      seeAllLink="/recommendations"
    >
      {/* Show first 5 trending artists as placeholder */}
      {trendingArtists.slice(0, 5).map(artist => (
        <div key={artist.id} className="min-w-[220px] max-w-[220px]">
          <ArtistCard {...artist} />
        </div>
      ))}
    </Section>
  );
}
