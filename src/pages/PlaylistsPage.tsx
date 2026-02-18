import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistCard } from "@/components/ui/playlist-card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";

interface Playlist {
  id: string; title: string; description: string; cover: string;
  trackCount: number; followerCount: number;
  createdBy: { name: string; id: string }; isEditorial: boolean;
}

const PlaylistsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editorialPlaylists, setEditorialPlaylists] = useState<Playlist[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();

  const processPlaylists = async (playlists: any[]) => {
    return Promise.all(playlists.map(async (playlist) => {
      const { count } = await supabase.from('playlist_tracks').select('*', { count: 'exact', head: true }).eq('playlist_id', playlist.id);
      return {
        id: playlist.id, title: playlist.title,
        description: playlist.description || "A curated playlist",
        cover: playlist.cover_image_path || "https://picsum.photos/id/1062/300/300",
        trackCount: count || 0, followerCount: playlist.follower_count || 0,
        createdBy: { name: playlist.profiles?.full_name || playlist.profiles?.username || "MAUDIO Editorial", id: playlist.created_by || "editorial" },
        isEditorial: playlist.is_editorial,
      };
    }));
  };

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const { data: editorialData, error: editorialError } = await supabase
        .from('playlists').select('id, title, description, cover_image_path, is_editorial, created_by, follower_count, profiles!playlists_created_by_fkey(username, full_name)')
        .eq('is_editorial', true).order('created_at', { ascending: false });
      if (editorialError) throw editorialError;

      let userData: any[] = [];
      if (user) {
        const { data, error } = await supabase
          .from('playlists').select('id, title, description, cover_image_path, is_editorial, created_by, follower_count, profiles!playlists_created_by_fkey(username, full_name)')
          .eq('created_by', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        userData = data || [];
      }

      setEditorialPlaylists(await processPlaylists(editorialData || []));
      setUserPlaylists(await processPlaylists(userData));
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlaylists(); }, [user]);

  const filter = (list: Playlist[]) => list.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile compact playlist row
  const PlaylistRow = ({ playlist }: { playlist: Playlist }) => (
    <Link to={`/playlist/${playlist.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
      <img src={playlist.cover} alt={playlist.title} className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block text-foreground">{playlist.title}</span>
        <p className="text-xs text-muted-foreground truncate">{playlist.trackCount} tracks · {playlist.createdBy.name}</p>
      </div>
    </Link>
  );

  const PlaylistGrid = ({ playlists, emptyMsg }: { playlists: Playlist[]; emptyMsg: string }) => {
    if (loading) return (
      <div className={isMobile ? 'space-y-2' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'}>
        {Array(4).fill(0).map((_, i) => isMobile ? (
          <div key={i} className="flex items-center gap-3 p-2.5">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
          </div>
        ) : (
          <div key={i}><Skeleton className="aspect-square w-full rounded-xl" /><div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /></div></div>
        ))}
      </div>
    );

    if (playlists.length === 0) return (
      <div className="text-center py-10"><p className="text-muted-foreground text-sm">{emptyMsg}</p></div>
    );

    if (isMobile) return (
      <div className="space-y-0.5">{playlists.map(p => <PlaylistRow key={p.id} playlist={p} />)}</div>
    );

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {playlists.map(p => <PlaylistCard key={p.id} {...p} />)}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>Playlists</h1>
          {user && ['admin', 'editorial'].includes(profile?.role || '') && (
            <CreatePlaylistModal onPlaylistCreated={fetchPlaylists} />
          )}
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search playlists..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Editorial Playlists</h2>
          <PlaylistGrid playlists={filter(editorialPlaylists)} emptyMsg={searchTerm ? 'No matches.' : 'No editorial playlists yet.'} />
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">My Playlists</h2>
          {user ? (
            <PlaylistGrid playlists={filter(userPlaylists)} emptyMsg={searchTerm ? 'No matches.' : "You haven't created any playlists."} />
          ) : (
            <div className="text-center py-10 bg-muted/30 rounded-xl border border-border">
              <p className="text-muted-foreground text-sm mb-3">Sign in to create playlists</p>
              <Button asChild><Link to="/auth">Sign In</Link></Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PlaylistsPage;
