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
import MAudioLogo from "@/assets/maudio-logo.svg";

interface PlaylistDetails {
  id: string;
  title: string;
  description: string;
  cover_image_path: string;
  is_editorial: boolean;
  created_by: string;
  creator_name: string;
  track_count: number;
  follower_count: number;
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

  useEffect(() => {
    if (playlistId) {
      loadPlaylistDetails();
    }
  }, [playlistId]);

  const loadPlaylistDetails = async () => {
    if (!playlistId) return;

    try {
      setLoading(true);

      // Load playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select(`
          id,
          title,
          description,
          cover_image_path,
          is_editorial,
          created_by,
          follower_count,
          profiles!playlists_created_by_fkey(username, full_name)
        `)
        .eq('id', playlistId)
        .single();

      if (playlistError) {
        console.error('Error loading playlist:', playlistError);
        toast.error('Failed to load playlist');
        navigate('/playlists');
        return;
      }

      // Get track count
      const { count } = await supabase
        .from('playlist_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlistId);

      setPlaylist({
        id: playlistData.id,
        title: playlistData.title,
        description: playlistData.description || '',
        cover_image_path: playlistData.cover_image_path || '',
        is_editorial: playlistData.is_editorial,
        created_by: playlistData.created_by,
        creator_name: playlistData.profiles?.full_name || playlistData.profiles?.username || 'Unknown',
        track_count: count || 0,
        follower_count: playlistData.follower_count || 0
      });

    } catch (error) {
      console.error('Error loading playlist details:', error);
      toast.error('Failed to load playlist');
      navigate('/playlists');
    } finally {
      setLoading(false);
    }
  };

  const playAllTracks = async () => {
    if (!playlistId) return;

    try {
      // Load all tracks from the playlist
      const { data: playlistTracks, error } = await supabase
        .from('playlist_tracks')
        .select(`
          position,
          tracks (*)
        `)
        .eq('playlist_id', playlistId)
        .order('position');

      if (error) {
        console.error('Error loading playlist tracks:', error);
        toast.error('Failed to load tracks');
        return;
      }

      if (!playlistTracks || playlistTracks.length === 0) {
        toast.error('No tracks in this playlist');
        return;
      }

      const tracks = playlistTracks.map(pt => ({
        ...pt.tracks as any,
        track_type: (pt.tracks as any)?.track_type as "single" | "ep" | "album" || "single"
      }));

      // Set queue and play first track
      setQueue(tracks);
      playTrack(tracks[0]);
      toast.success('Playing playlist');

    } catch (error) {
      console.error('Error playing playlist:', error);
      toast.error('Failed to play playlist');
    }
  };

  const isOwner = playlist && user && (
    playlist.created_by === user.id || 
    ['admin', 'editorial'].includes(user?.id || '')
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/4 mb-6"></div>
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="w-64 h-64 bg-white/10 rounded-lg"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-white/10 rounded w-1/2"></div>
                <div className="h-4 bg-white/10 rounded w-1/3"></div>
                <div className="h-4 bg-white/10 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!playlist) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
            <Button onClick={() => navigate('/playlists')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Playlists
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const updateFollowerCount = (newCount: number) => {
    setPlaylist(prev => prev ? { ...prev, follower_count: newCount } : null);
  };

  const handlePlaylistUpdated = () => {
    loadPlaylistDetails();
  };

  const coverUrl = playlist.cover_image_path 
    ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${playlist.cover_image_path}`
    : "https://picsum.photos/id/1062/300/300";

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/playlists')}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Playlists
        </Button>

        {/* Playlist Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="relative w-64 h-64 mx-auto md:mx-0">
            <img
              src={coverUrl}
              alt={playlist.title}
              className="w-full h-full rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://picsum.photos/id/1062/300/300";
              }}
            />
            {playlist.is_editorial && (
              <div className="absolute bottom-2 right-2 bg-black/80 rounded-md p-1">
                <img 
                  src={MAudioLogo} 
                  alt="MAUDIO" 
                  className="h-4 w-auto text-primary"
                />
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-sm text-primary font-medium">
                {playlist.is_editorial ? 'Editorial Playlist' : 'User Playlist'}
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-white break-words">
                {playlist.title}
              </h1>
            </div>
            
            {playlist.description && (
              <p className="text-gray-300 break-words">{playlist.description}</p>
            )}
            
            <div className="text-sm text-gray-400">
              <p>Created by {playlist.creator_name}</p>
              <p>{playlist.track_count} track{playlist.track_count !== 1 ? 's' : ''}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <Button
                  onClick={playAllTracks}
                  className="maudio-gradient-bg"
                  disabled={playlist.track_count === 0}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Play All
                </Button>
                
                {isOwner && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowManager(!showManager)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Settings className="h-5 w-5 mr-2" />
                      {showManager ? 'Hide' : 'Manage'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowEditModal(true)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Edit2 className="h-5 w-5 mr-2" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
              
              <PlaylistFollowButton
                playlistId={playlist.id}
                followerCount={playlist.follower_count}
                onFollowerCountChange={updateFollowerCount}
              />
            </div>
          </div>
        </div>

        {/* Playlist Manager */}
        <PlaylistManager 
          playlistId={playlist.id} 
          isOwner={!!isOwner}
          showManager={showManager || !isOwner}
        />

        {/* Edit Modal */}
        {isOwner && (
          <PlaylistEditModal
            playlistId={playlist.id}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onUpdated={handlePlaylistUpdated}
            currentTitle={playlist.title}
            currentDescription={playlist.description}
            currentCoverPath={playlist.cover_image_path}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default PlaylistDetailPage;