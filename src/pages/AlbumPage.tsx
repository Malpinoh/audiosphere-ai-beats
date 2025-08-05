import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatTracks } from "@/services/track-service";
import { Track } from "@/types/track-types";
import { useMusicPlayer } from "@/contexts/music-player";
import { Button } from "@/components/ui/button";
import { Play, Heart, MoreHorizontal, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Album {
  name: string;
  artist: string;
  type: 'album' | 'ep';
  coverArt: string;
  tracks: Track[];
  totalTracks: number;
  releaseDate?: string;
  description?: string;
}

const AlbumPage = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const { setQueue, playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer();

  useEffect(() => {
    if (albumId) {
      fetchAlbum();
    }
  }, [albumId]);

  const fetchAlbum = async () => {
    try {
      setLoading(true);
      
      // Fetch tracks by album name or ID
      const { data: tracks, error } = await supabase
        .from('tracks')
        .select('*')
        .or(`album_name.eq.${albumId},id.eq.${albumId}`)
        .eq('published', true);

      if (error) throw error;

      if (tracks && tracks.length > 0) {
        const formattedTracks = formatTracks(tracks);
        const firstTrack = formattedTracks[0];
        
        const albumData: Album = {
          name: firstTrack.album_name || firstTrack.title,
          artist: firstTrack.artist,
          type: firstTrack.track_type as 'album' | 'ep',
          coverArt: firstTrack.cover_art_path?.startsWith('http') 
            ? firstTrack.cover_art_path 
            : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${firstTrack.cover_art_path}`,
          tracks: formattedTracks.sort((a, b) => (a.track_number || 0) - (b.track_number || 0)),
          totalTracks: firstTrack.total_tracks || formattedTracks.length,
          releaseDate: firstTrack.uploaded_at,
          description: firstTrack.description
        };
        
        setAlbum(albumData);
      }
    } catch (error) {
      console.error('Error fetching album:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAlbum = () => {
    if (!album) return;
    setQueue(album.tracks);
    if (album.tracks.length > 0) {
      playTrack(album.tracks[0]);
    }
  };

  const handleTrackPlay = (track: Track) => {
    const isCurrentTrack = currentTrack?.id === track.id;
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = album?.tracks.reduce((acc, track) => acc + (track.duration || 0), 0) || 0;

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <Skeleton className="w-64 h-64 rounded-lg" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!album) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">Album Not Found</h1>
            <p className="text-white/60">The album you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <img 
            src={album.coverArt}
            alt={album.name}
            className="w-64 h-64 rounded-lg object-cover shadow-xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://picsum.photos/300/300';
            }}
          />
          
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm text-white/60 uppercase tracking-wide">
                {album.type}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {album.name}
              </h1>
              <p className="text-xl text-white/80">{album.artist}</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Calendar className="h-4 w-4" />
              <span>{album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'Unknown'}</span>
              <span>•</span>
              <span>{album.tracks.length} tracks</span>
              {totalDuration > 0 && (
                <>
                  <span>•</span>
                  <span>{formatDuration(totalDuration)}</span>
                </>
              )}
            </div>

            {album.description && (
              <p className="text-white/70 max-w-2xl">{album.description}</p>
            )}
            
            <div className="flex items-center gap-4 pt-4">
              <Button 
                onClick={handlePlayAlbum}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-base"
              >
                <Play className="h-5 w-5 mr-2" />
                Play {album.type}
              </Button>
              
              <Button variant="outline" size="icon" className="h-12 w-12">
                <Heart className="h-5 w-5" />
              </Button>
              
              <Button variant="ghost" size="icon" className="h-12 w-12">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="bg-black/20 rounded-lg p-6">
          <div className="grid grid-cols-[40px_1fr_100px_60px] gap-4 text-sm text-white/60 mb-4 pb-2 border-b border-white/10">
            <span>#</span>
            <span>Title</span>
            <span>Duration</span>
            <span>Plays</span>
          </div>
          
          <div className="space-y-2">
            {album.tracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrentTrack && isPlaying;
              
              return (
                <div 
                  key={track.id}
                  className="grid grid-cols-[40px_1fr_100px_60px] gap-4 items-center p-2 rounded hover:bg-white/5 cursor-pointer group"
                  onClick={() => handleTrackPlay(track)}
                >
                  <div className="flex items-center justify-center">
                    {isCurrentPlaying ? (
                      <div className="h-4 w-4 text-primary">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    ) : (
                      <>
                        <span className="text-white/60 group-hover:opacity-0 transition-opacity">
                          {track.track_number || index + 1}
                        </span>
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={track.cover_art_path?.startsWith('http') 
                        ? track.cover_art_path 
                        : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}`
                      }
                      alt={track.title}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${isCurrentTrack ? 'text-primary' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-sm text-white/60 truncate">{track.artist}</p>
                    </div>
                  </div>
                  
                  <span className="text-white/60 text-sm">
                    {track.duration ? formatDuration(track.duration) : '0:00'}
                  </span>
                  
                  <span className="text-white/60 text-sm">
                    {track.play_count || 0}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AlbumPage;