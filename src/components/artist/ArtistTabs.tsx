
import { Loader2, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Track } from "@/types/track-types";
import type { ArtistProfile } from "@/hooks/use-artist-profile";
import { Card, CardContent } from "@/components/ui/card";
import { useMusicPlayer } from "@/contexts/music-player";
import { CollapsibleAlbum } from "./CollapsibleAlbum";
import { formatDuration } from "@/utils/formatTime";

interface ArtistTabsProps {
  artist: ArtistProfile;
  tracks: Track[];
  tracksLoading: boolean;
  isMobile?: boolean;
}

interface AlbumGroup {
  name: string;
  type: string;
  cover: string;
  tracks: Track[];
  totalTracks: number;
}

export const ArtistTabs = ({ artist, tracks, tracksLoading, isMobile = false }: ArtistTabsProps) => {
  const { playTrack } = useMusicPlayer();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getCoverUrl = (path: string | undefined) => {
    if (!path) return '/placeholder.svg';
    return path.startsWith('http')
      ? path
      : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${path}`;
  };

  const handleTrackPlay = (track: Track) => {
    playTrack(track);
  };

  return (
    <Tabs defaultValue="tracks">
      <TabsList className="mb-4 md:mb-6 w-full justify-start overflow-x-auto bg-muted border-border">
        <TabsTrigger value="tracks" className="text-foreground data-[state=active]:bg-background">Tracks</TabsTrigger>
        <TabsTrigger value="albums" className="text-foreground data-[state=active]:bg-background">Albums</TabsTrigger>
        <TabsTrigger value="about" className="text-foreground data-[state=active]:bg-background">About</TabsTrigger>
      </TabsList>
      
      <TabsContent value="tracks" className="space-y-3 md:space-y-4">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-foreground">Popular Tracks</h2>
        
        {tracksLoading ? (
          <div className="flex justify-center items-center p-8 md:p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading tracks...</span>
          </div>
        ) : tracks.length > 0 ? (
          <div className="space-y-2 md:space-y-3">
            {tracks
              .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
              .map((track, index) => (
                <div 
                  key={track.id} 
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                  onClick={() => handleTrackPlay(track)}
                >
                  <span className="text-muted-foreground font-medium w-5 md:w-6 text-center text-sm md:text-base group-hover:opacity-0 transition-opacity">
                    {index + 1}
                  </span>
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="h-4 w-4 md:h-5 md:w-5 text-foreground ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <img 
                    src={getCoverUrl(track.cover_art_path)} 
                    alt={track.title}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate text-sm md:text-base">{track.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{track.genre}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {(track.play_count || 0) >= 1000 && (
                      <div className="text-xs md:text-sm font-medium text-foreground">
                        {formatNumber(track.play_count || 0)} streams
                      </div>
                    )}
                    <div className="text-[10px] md:text-xs text-muted-foreground">
                      {formatDuration(track.duration)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-center p-8 md:p-12">
            No tracks available from this artist yet
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="albums">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-foreground">Albums & EPs</h2>
        
        {tracksLoading ? (
          <div className="flex justify-center items-center p-8 md:p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading albums...</span>
          </div>
        ) : (() => {
          const albumGroups = tracks.reduce((acc, track) => {
            if (track.track_type === 'single') return acc;
            
            const albumKey = track.album_name || track.title;
            if (!acc[albumKey]) {
              acc[albumKey] = {
                name: albumKey,
                type: track.track_type || 'album',
                cover: getCoverUrl(track.cover_art_path),
                tracks: [],
                totalTracks: track.total_tracks || 0
              };
            }
            acc[albumKey].tracks.push(track);
            return acc;
          }, {} as Record<string, AlbumGroup>);

          const albums = Object.values(albumGroups);

          return albums.length > 0 ? (
            <div className="space-y-4">
              {albums.map((album) => (
                <CollapsibleAlbum key={album.name} album={album} />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-center p-8 md:p-12">
              No albums or EPs available from this artist yet
            </div>
          );
        })()}
      </TabsContent>
      
      <TabsContent value="about">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-foreground flex items-center gap-2">
          About {artist.full_name}
          {artist.is_verified && (
            <CheckCircle className="h-5 w-5 text-primary" />
          )}
        </h2>
        
        <Card className="mb-6 bg-card border-border">
          <CardContent className="pt-4 md:pt-6">
            {artist.bio ? (
              <p className="text-muted-foreground mb-4 leading-relaxed text-sm md:text-base">{artist.bio}</p>
            ) : (
              <p className="text-muted-foreground mb-4 text-sm md:text-base">
                {artist.username ? `@${artist.username}` : artist.full_name} is an artist on MAUDIO.
              </p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
              <div>
                <h3 className="font-semibold text-xs md:text-sm text-muted-foreground mb-1">Username</h3>
                <p className="text-foreground text-sm md:text-base">{artist.username ? `@${artist.username}` : "Not provided"}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-xs md:text-sm text-muted-foreground mb-1">Followers</h3>
                <p className="text-foreground text-sm md:text-base">{formatNumber(artist.follower_count || 0)}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-xs md:text-sm text-muted-foreground mb-1">Monthly Listeners</h3>
                <p className="text-foreground text-sm md:text-base">{formatNumber(artist.monthly_listeners || 0)}</p>
              </div>
              
              {artist.website && (
                <div>
                  <h3 className="font-semibold text-xs md:text-sm text-muted-foreground mb-1">Website</h3>
                  <p>
                    <a 
                      href={artist.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm md:text-base"
                    >
                      {artist.website}
                    </a>
                  </p>
                </div>
              )}
              
              {artist.is_verified && (
                <div>
                  <h3 className="font-semibold text-xs md:text-sm text-muted-foreground mb-1">Status</h3>
                  <p className="flex items-center text-foreground text-sm md:text-base">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    Verified Artist
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
