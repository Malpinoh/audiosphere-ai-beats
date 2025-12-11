import React from "react";
import { Section } from "./FeaturedSection";
import { AlbumCard } from "@/components/ui/album-card";
import { useTracks } from "@/hooks/use-tracks";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingAlbumCard = () => (
  <div className="min-w-[140px] max-w-[140px] sm:min-w-[160px] sm:max-w-[160px] md:min-w-[180px] md:max-w-[180px] snap-start">
    <div className="rounded-xl overflow-hidden bg-card">
      <Skeleton className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  </div>
);

// Featured albums section component
export function FeaturedAlbums() {
  const { tracks, loading } = useTracks({ 
    published: true, 
    limit: 20,
    orderBy: { column: 'uploaded_at', ascending: false }
  });
  
  // Group tracks into albums/EPs
  const albums = React.useMemo(() => {
    const albumGroups = tracks.reduce((acc, track) => {
      if (track.track_type === 'single') return acc;
      
      const albumKey = track.album_name || track.title;
      if (!acc[albumKey]) {
        acc[albumKey] = {
          name: albumKey,
          artist: track.artist,
          type: track.track_type as 'album' | 'ep',
          coverArt: track.cover_art_path?.startsWith('http') 
            ? track.cover_art_path 
            : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}`,
          tracks: [],
          releaseDate: track.uploaded_at
        };
      }
      acc[albumKey].tracks.push(track);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(albumGroups).slice(0, 8); // Show max 8 albums
  }, [tracks]);
  
  if (loading) {
    return (
      <Section 
        title="Featured Albums & EPs" 
        subtitle="Latest album releases"
        seeAllLink="/browse?type=albums"
      >
        {Array(6).fill(0).map((_, i) => (
          <LoadingAlbumCard key={i} />
        ))}
      </Section>
    );
  }

  if (albums.length === 0) {
    return null; // Don't show section if no albums
  }
  
  return (
    <Section 
      title="Featured Albums & EPs" 
      subtitle="Latest album releases"
      seeAllLink="/browse?type=albums"
    >
      {albums.map((album: any) => (
        <div key={album.name} className="min-w-[140px] max-w-[140px] sm:min-w-[160px] sm:max-w-[160px] md:min-w-[180px] md:max-w-[180px] snap-start">
          <AlbumCard
            albumName={album.name}
            artistName={album.artist}
            tracks={album.tracks}
            coverArt={album.coverArt}
            type={album.type}
            releaseDate={album.releaseDate}
          />
        </div>
      ))}
    </Section>
  );
}