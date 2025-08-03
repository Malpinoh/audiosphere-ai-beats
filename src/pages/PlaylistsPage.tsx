
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistCard } from "@/components/ui/playlist-card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";

interface Playlist {
  id: string;
  title: string;
  description: string;
  cover: string;
  trackCount: number;
  followerCount: number;
  createdBy: {
    name: string;
    id: string;
  };
  isEditorial: boolean;
}

const PlaylistsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editorialPlaylists, setEditorialPlaylists] = useState<Playlist[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  
  // Fetch real playlists from database
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        
        // Fetch editorial playlists
        const { data: editorialData, error: editorialError } = await supabase
          .from('playlists')
          .select(`
            id,
            title,
            description,
            cover_image_path,
            is_editorial,
            created_by,
            profiles!playlists_created_by_fkey(username, full_name)
          `)
          .eq('is_editorial', true)
          .order('created_at', { ascending: false });

        if (editorialError) throw editorialError;

        // Fetch user playlists if logged in
        let userData = [];
        if (user) {
          const { data: userPlaylistData, error: userError } = await supabase
            .from('playlists')
            .select(`
              id,
              title,
              description,
              cover_image_path,
              is_editorial,
              created_by,
              profiles!playlists_created_by_fkey(username, full_name)
            `)
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

          if (userError) throw userError;
          userData = userPlaylistData || [];
        }

        // Get track counts for all playlists
        const processPlaylists = async (playlists: any[]) => {
          return Promise.all(
            playlists.map(async (playlist) => {
              const { count } = await supabase
                .from('playlist_tracks')
                .select('*', { count: 'exact', head: true })
                .eq('playlist_id', playlist.id);

              return {
                id: playlist.id,
                title: playlist.title,
                description: playlist.description || "A curated playlist",
                cover: playlist.cover_image_path || "https://picsum.photos/id/1062/300/300",
                trackCount: count || 0,
                followerCount: playlist.follower_count || 0,
                createdBy: {
                  name: playlist.profiles?.full_name || playlist.profiles?.username || "MAUDIO Editorial",
                  id: playlist.created_by || "editorial"
                },
                isEditorial: playlist.is_editorial
              };
            })
          );
        };

        const processedEditorial = await processPlaylists(editorialData || []);
        const processedUser = await processPlaylists(userData);

        setEditorialPlaylists(processedEditorial);
        setUserPlaylists(processedUser);

      } catch (error) {
        console.error('Error fetching playlists:', error);
        toast.error('Failed to load playlists');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [user]);
  
  const filteredEditorialPlaylists = editorialPlaylists.filter(playlist => 
    playlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUserPlaylists = userPlaylists.filter(playlist => 
    playlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const refreshPlaylists = async () => {
    // Refresh both editorial and user playlists
    try {
      setLoading(true);
      
      // Fetch editorial playlists
      const { data: editorialData, error: editorialError } = await supabase
        .from('playlists')
        .select(`
          id,
          title,
          description,
          cover_image_path,
          is_editorial,
          created_by,
          profiles!playlists_created_by_fkey(username, full_name)
        `)
        .eq('is_editorial', true)
        .order('created_at', { ascending: false });

      if (editorialError) throw editorialError;

      // Fetch user playlists if logged in
      let userData = [];
      if (user) {
        const { data: userPlaylistData, error: userError } = await supabase
          .from('playlists')
          .select(`
            id,
            title,
            description,
            cover_image_path,
            is_editorial,
            created_by,
            profiles!playlists_created_by_fkey(username, full_name)
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (userError) throw userError;
        userData = userPlaylistData || [];
      }

      // Get track counts for all playlists
      const processPlaylists = async (playlists: any[]) => {
        return Promise.all(
          playlists.map(async (playlist) => {
            const { count } = await supabase
              .from('playlist_tracks')
              .select('*', { count: 'exact', head: true })
              .eq('playlist_id', playlist.id);

            return {
              id: playlist.id,
              title: playlist.title,
              description: playlist.description || "A curated playlist",
              cover: playlist.cover_image_path || "https://picsum.photos/id/1062/300/300",
              trackCount: count || 0,
              followerCount: playlist.follower_count || 0,
              createdBy: {
                name: playlist.profiles?.full_name || playlist.profiles?.username || "MAUDIO Editorial",
                id: playlist.created_by || "editorial"
              },
              isEditorial: playlist.is_editorial
            };
          })
        );
      };

      const processedEditorial = await processPlaylists(editorialData || []);
      const processedUser = await processPlaylists(userData);

      setEditorialPlaylists(processedEditorial);
      setUserPlaylists(processedUser);

    } catch (error) {
      console.error('Error refreshing playlists:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Playlists</h1>
            <p className="text-muted-foreground">
              Discover curated collections or create your own
            </p>
          </div>
          
          {user && ['admin', 'editorial'].includes(profile?.role || '') && (
            <CreatePlaylistModal onPlaylistCreated={refreshPlaylists} />
          )}
        </div>
        
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search playlists..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Editorial playlists */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">Editorial Playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredEditorialPlaylists.length > 0 ? (
              filteredEditorialPlaylists.map(playlist => (
                <PlaylistCard
                  key={playlist.id}
                  id={playlist.id}
                  title={playlist.title}
                  description={playlist.description}
                  cover={playlist.cover}
                  trackCount={playlist.trackCount}
                  isEditorial={playlist.isEditorial}
                  followerCount={playlist.followerCount}
                  createdBy={playlist.createdBy}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No editorial playlists found matching your search.' : 'No editorial playlists available yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* My Playlists */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">My Playlists</h2>
          {user ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {loading ? (
                Array(2).fill(0).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <Skeleton className="aspect-square w-full" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredUserPlaylists.length > 0 ? (
                filteredUserPlaylists.map(playlist => (
                <PlaylistCard
                  key={playlist.id}
                  id={playlist.id}
                  title={playlist.title}
                  description={playlist.description}
                  cover={playlist.cover}
                  trackCount={playlist.trackCount}
                  isEditorial={playlist.isEditorial}
                  followerCount={playlist.followerCount}
                  createdBy={playlist.createdBy}
                />
              ))
              ) : (
                <div className="col-span-full bg-maudio-darker rounded-lg p-10 text-center">
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'No playlists found matching your search.' : "You haven't created any playlists yet"}
                  </p>
                  {!searchTerm && ['admin', 'editorial'].includes(profile?.role || '') && (
                    <CreatePlaylistModal onPlaylistCreated={refreshPlaylists} />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-maudio-darker rounded-lg p-10 text-center">
              <p className="text-muted-foreground mb-4">Sign in to create and view your playlists</p>
              <Button asChild>
                <a href="/login">Sign In</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PlaylistsPage;
