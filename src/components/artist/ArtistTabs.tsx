
import { Loader2, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Track } from "@/types/track-types";
import type { ArtistProfile } from "@/hooks/use-artist-profile";
import { Card, CardContent } from "@/components/ui/card";
import { useMusicPlayer } from "@/contexts/music-player";

interface ArtistTabsProps {
  artist: ArtistProfile;
  tracks: Track[];
  tracksLoading: boolean;
  isMobile?: boolean;
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

  const handleTrackPlay = (track: Track) => {
    playTrack(track);
  };

  return (
    <Tabs defaultValue="tracks">
      <TabsList className="mb-6 w-full justify-start overflow-x-auto bg-black/20 border-white/10">
        <TabsTrigger value="tracks" className="text-white data-[state=active]:bg-white/20">Tracks</TabsTrigger>
        <TabsTrigger value="albums" className="text-white data-[state=active]:bg-white/20">Albums</TabsTrigger>
        <TabsTrigger value="about" className="text-white data-[state=active]:bg-white/20">About</TabsTrigger>
      </TabsList>
      
      <TabsContent value="tracks" className="space-y-4">
        <h2 className="text-xl font-bold mb-4 text-white">Popular Tracks</h2>
        
        {tracksLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-white">Loading tracks...</span>
          </div>
        ) : tracks.length > 0 ? (
          <div className="space-y-3">
            {tracks
              .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
              .map((track, index) => (
                <div 
                  key={track.id} 
                  className="flex items-center gap-4 p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors cursor-pointer group"
                  onClick={() => handleTrackPlay(track)}
                >
                  <span className="text-white/60 font-medium w-6 text-center group-hover:opacity-0 transition-opacity">
                    {index + 1}
                  </span>
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="h-5 w-5 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <img 
                    src={track.cover_art_path?.startsWith('http') 
                      ? track.cover_art_path 
                      : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}`
                    } 
                    alt={track.title}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{track.title}</h3>
                    <p className="text-sm text-white/60">{track.genre}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {formatNumber(track.play_count || 0)} plays
                    </div>
                    <div className="text-xs text-white/60">
                      {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-white/60 text-center p-12">
            No tracks available from this artist yet
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="albums">
        <h2 className="text-xl font-bold mb-4 text-white">Albums & EPs</h2>
        
        {tracksLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-white">Loading albums...</span>
          </div>
        ) : (() => {
          // Group tracks by album/EP
          const albumGroups = tracks.reduce((acc, track) => {
            if (track.track_type === 'single') return acc;
            
            const albumKey = track.album_name || track.title;
            if (!acc[albumKey]) {
              acc[albumKey] = {
                name: albumKey,
                type: track.track_type,
                cover: track.cover_art_path?.startsWith('http') 
                  ? track.cover_art_path 
                  : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}`,
                tracks: [],
                totalTracks: track.total_tracks || 0
              };
            }
            acc[albumKey].tracks.push(track);
            return acc;
          }, {} as Record<string, any>);

          const albums = Object.values(albumGroups);

          return albums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album: any) => (
                <div key={album.name} className="bg-black/20 rounded-lg p-4 hover:bg-black/30 transition-colors">
                    <div className="flex items-start gap-4 mb-4">
                      <img 
                        src={album.cover} 
                        alt={album.name}
                        className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/album/${encodeURIComponent(album.name)}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-semibold text-white truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/album/${encodeURIComponent(album.name)}`;
                          }}
                        >
                          {album.name}
                        </h3>
                        <p className="text-sm text-white/60 capitalize">{album.type}</p>
                        <p className="text-xs text-white/40">{album.tracks.length} of {album.totalTracks} tracks</p>
                      </div>
                    </div>
                  
                  <div className="space-y-2">
                    {album.tracks
                      .sort((a: any, b: any) => (a.track_number || 0) - (b.track_number || 0))
                      .map((track: any) => (
                      <div 
                        key={track.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-black/20 cursor-pointer group"
                        onClick={() => handleTrackPlay(track)}
                      >
                        <span className="text-white/40 text-sm w-6 text-center group-hover:opacity-0 transition-opacity">
                          {track.track_number || '—'}
                        </span>
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-3 w-3 text-white ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{track.title}</p>
                        </div>
                        <span className="text-xs text-white/40">
                          {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/60 text-center p-12">
              No albums or EPs available from this artist yet
            </div>
          );
        })()}
      </TabsContent>
      
      <TabsContent value="about">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
          About {artist.full_name}
          {artist.is_verified && (
            <CheckCircle className="h-5 w-5 text-blue-400" />
          )}
        </h2>
        
        <Card className="mb-6 bg-black/20 border-white/10">
          <CardContent className="pt-6">
            {artist.bio ? (
              <p className="text-white/80 mb-4 leading-relaxed">{artist.bio}</p>
            ) : (
              <p className="text-white/60 mb-4">
                {artist.username ? `@${artist.username}` : artist.full_name} is an artist on MusicAudio.
              </p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold text-sm text-white/60 mb-1">Username</h3>
                <p className="text-white">{artist.username ? `@${artist.username}` : "Not provided"}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-white/60 mb-1">Followers</h3>
                <p className="text-white">{formatNumber(artist.follower_count || 0)}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-white/60 mb-1">Monthly Listeners</h3>
                <p className="text-white">{formatNumber(artist.monthly_listeners || 0)}</p>
              </div>
              
              {artist.website && (
                <div>
                  <h3 className="font-semibold text-sm text-white/60 mb-1">Website</h3>
                  <p>
                    <a 
                      href={artist.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {artist.website}
                    </a>
                  </p>
                </div>
              )}
              
              {artist.is_verified && (
                <div>
                  <h3 className="font-semibold text-sm text-white/60 mb-1">Status</h3>
                  <p className="flex items-center text-white">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
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
