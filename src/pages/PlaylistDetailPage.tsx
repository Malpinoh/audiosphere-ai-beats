import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Settings, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PlaylistManager } from "@/components/playlist/PlaylistManager";
import { PlaylistFollowButton } from "@/components/playlist/PlaylistFollowButton";
import { PlaylistEditModal } from "@/components/playlist/PlaylistEditModal";
import { useMusicPlayer } from "@/contexts/music-player";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import MAudioLogo from "@/assets/maudio-logo.svg";

interface PlaylistDetails {
  id: string; title: string; description: string; cover_image_path: string;
  is_editorial: boolean; created_by: string; creator_name: string;
  track_count: number; follower_count: number;
}

const PlaylistDetailPage = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setQueue, playTrack } = useMusicPlayer();
  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => { if (playlistId) loadPlaylistDetails(); }, [playlistId]);

  const loadPlaylistDetails = async () => {
    if (!playlistId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('playlists')
        .select('id, title, description, cover_image_path, is_editorial, created_by, follower_count, profiles!playlists_created_by_fkey(username, full_name)')
        .eq('id', playlistId).single();
      if (error) { toast.error('Failed to load playlist'); navigate('/playlists'); return; }

      const { count } = await supabase.from('playlist_tracks').select('*', { count: 'exact', head: true }).eq('playlist_id', playlistId);
      setPlaylist({
        id: data.id, title: data.title, description: data.description || '',
        cover_image_path: data.cover_image_path || '', is_editorial: data.is_editorial,
        created_by: data.created_by, creator_name: data.profiles?.full_name || data.profiles?.username || 'Unknown',
        track_count: count || 0, follower_count: data.follower_count || 0,
      });
    } catch { toast.error('Failed to load playlist'); navigate('/playlists'); } finally { setLoading(false); }
  };

  const playAllTracks = async () => {
    if (!playlistId) return;
    try {
      const { data, error } = await supabase.from('playlist_tracks')
        .select('position, tracks (*)').eq('playlist_id', playlistId).order('position');
      if (error || !data?.length) { toast.error('No tracks to play'); return; }
      const tracks = data.map(pt => ({ ...pt.tracks as any, track_type: (pt.tracks as any)?.track_type || "single" }));
      setQueue(tracks); playTrack(tracks[0]); toast.success('Playing playlist');
    } catch { toast.error('Failed to play'); }
  };

  const isOwner = playlist && user && playlist.created_by === user.id;

  if (loading) return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className={`flex ${isMobile ? 'flex-col items-center' : 'flex-row'} gap-6 mb-8`}>
          <Skeleton className={`${isMobile ? 'w-48 h-48' : 'w-64 h-64'} rounded-xl`} />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </MainLayout>
  );

  if (!playlist) return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
        <Button onClick={() => navigate('/playlists')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      </div>
    </MainLayout>
  );

  const coverUrl = playlist.cover_image_path
    ? (playlist.cover_image_path.startsWith('http') ? playlist.cover_image_path
      : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${playlist.cover_image_path}`)
    : "/placeholder.svg";

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Button variant="ghost" onClick={() => navigate('/playlists')} className="mb-4 text-muted-foreground hover:text-foreground" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1.5" />Back
        </Button>

        <div className={`flex ${isMobile ? 'flex-col items-center text-center' : 'flex-row'} gap-5 mb-6`}>
          <div className={`relative ${isMobile ? 'w-48 h-48' : 'w-56 h-56'} flex-shrink-0`}>
            <img src={coverUrl} alt={playlist.title} className="w-full h-full rounded-xl object-cover shadow-lg"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
            {playlist.is_editorial && (
              <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-md p-1">
                <img src={MAudioLogo} alt="MAUDIO" className="h-3.5 w-auto" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <span className="text-xs text-primary font-medium">{playlist.is_editorial ? 'Editorial' : 'Playlist'}</span>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-foreground`}>{playlist.title}</h1>
            </div>
            {playlist.description && <p className="text-muted-foreground text-sm">{playlist.description}</p>}
            <p className="text-xs text-muted-foreground">By {playlist.creator_name} · {playlist.track_count} tracks</p>

            <div className={`flex ${isMobile ? 'justify-center' : ''} items-center gap-2 flex-wrap`}>
              <Button onClick={playAllTracks} className="maudio-gradient-bg gap-1.5" size="sm" disabled={playlist.track_count === 0}>
                <Play className="h-4 w-4" />Play All
              </Button>
              {isOwner && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setShowManager(!showManager)} className="gap-1.5">
                    <Settings className="h-3.5 w-3.5" />{showManager ? 'Hide' : 'Manage'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)} className="gap-1.5">
                    <Edit2 className="h-3.5 w-3.5" />Edit
                  </Button>
                </>
              )}
              <PlaylistFollowButton playlistId={playlist.id} followerCount={playlist.follower_count}
                onFollowerCountChange={(c) => setPlaylist(prev => prev ? { ...prev, follower_count: c } : null)} />
            </div>
          </div>
        </div>

        <PlaylistManager playlistId={playlist.id} isOwner={!!isOwner} showManager={showManager || !isOwner} />

        {isOwner && (
          <PlaylistEditModal playlistId={playlist.id} isOpen={showEditModal} onClose={() => setShowEditModal(false)}
            onUpdated={loadPlaylistDetails} currentTitle={playlist.title} currentDescription={playlist.description}
            currentCoverPath={playlist.cover_image_path} />
        )}
      </div>
    </MainLayout>
  );
};

export default PlaylistDetailPage;
