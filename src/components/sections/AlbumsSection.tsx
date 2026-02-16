import React from "react";
import { Section } from "./FeaturedSection";
import { AlbumCard } from "@/components/ui/album-card";
import { useTracks } from "@/hooks/use-tracks";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { Calendar, Music } from "lucide-react";

// Compact mobile album row
function AlbumListItem({ albumName, artistName, coverArt, tracks, type }: { albumName: string; artistName: string; coverArt: string; tracks: any[]; type: string }) {
  return (
    <Link to={`/album/${encodeURIComponent(albumName)}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
      <img
        src={coverArt}
        alt={albumName}
        className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
      />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block text-foreground">{albumName}</span>
        <p className="text-xs text-muted-foreground truncate">{artistName} · {tracks.length} tracks · {type.toUpperCase()}</p>
      </div>
    </Link>
  );
}

const LoadingAlbumCard = ({ isMobile }: { isMobile: boolean }) => {
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
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
};

export function FeaturedAlbums() {
  const { tracks, loading } = useTracks({ 
    published: true, 
    limit: 20,
    orderBy: { column: 'uploaded_at', ascending: false }
  });
  const isMobile = useIsMobile();
  
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

    return Object.values(albumGroups).slice(0, 8);
  }, [tracks]);
  
  if (loading) {
    return (
      <Section title="Featured Albums & EPs" subtitle="Latest album releases" seeAllLink="/browse?type=albums">
        {Array(isMobile ? 4 : 6).fill(0).map((_, i) => (
          <LoadingAlbumCard key={i} isMobile={isMobile} />
        ))}
      </Section>
    );
  }

  if (albums.length === 0) return null;
  
  return (
    <Section title="Featured Albums & EPs" subtitle="Latest album releases" seeAllLink="/browse?type=albums">
      {albums.map((album: any) => (
        isMobile ? (
          <AlbumListItem key={album.name} albumName={album.name} artistName={album.artist} coverArt={album.coverArt} tracks={album.tracks} type={album.type} />
        ) : (
          <div key={album.name} className="min-w-[180px] max-w-[180px] snap-start">
            <AlbumCard
              albumName={album.name}
              artistName={album.artist}
              tracks={album.tracks}
              coverArt={album.coverArt}
              type={album.type}
              releaseDate={album.releaseDate}
            />
          </div>
        )
      ))}
    </Section>
  );
}
