import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArtistCard } from "@/components/ui/artist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  follower_count: number;
  is_verified: boolean;
  bio?: string;
  website?: string;
  tracks: number;
}

const LoadingArtistCard = () => (
  <div className="maudio-card overflow-hidden text-center">
    <div className="relative pt-5">
      <div className="mx-auto h-28 w-28 rounded-full overflow-hidden border-4 border-maudio-purple/20">
        <Skeleton className="w-full h-full" />
      </div>
    </div>
    <div className="p-4 space-y-2">
      <Skeleton className="h-4 w-3/4 mx-auto" />
      <Skeleton className="h-3 w-1/2 mx-auto" />
      <Skeleton className="h-8 w-full mt-2" />
    </div>
  </div>
);

const ArtistsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("followers");
  const [verifiedOnly, setVerifiedOnly] = useState<string>("all");

  // Fetch artists with tracks count
  const fetchArtists = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          avatar_url,
          follower_count,
          is_verified,
          bio,
          website
        `)
        .eq('role', 'artist');

      // Apply verified filter
      if (verifiedOnly === "verified") {
        query = query.eq('is_verified', true);
      }

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      if (sortBy === "followers") {
        query = query.order('follower_count', { ascending: false });
      } else if (sortBy === "name") {
        query = query.order('full_name', { ascending: true });
      } else if (sortBy === "recent") {
        query = query.order('created_at', { ascending: false });
      }

      query = query.limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching artists:', error);
        return;
      }

      // Get track counts for each artist
      const artistsWithTrackCounts = await Promise.all(
        (data || []).map(async (artist) => {
          const { count } = await supabase
            .from('tracks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', artist.id)
            .eq('published', true);

          return {
            ...artist,
            tracks: count || 0
          };
        })
      );

      setArtists(artistsWithTrackCounts);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, [searchTerm, sortBy, verifiedOnly]);

  const handleSearch = () => {
    fetchArtists();
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">All Artists</h1>
        
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search artists by name or username"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="followers">Most Followers</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="recent">Recently Joined</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={verifiedOnly} onValueChange={setVerifiedOnly}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Artists</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>
        
        {/* Artists Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {loading ? (
            Array(20).fill(0).map((_, i) => (
              <LoadingArtistCard key={i} />
            ))
          ) : artists.length > 0 ? (
            artists.map(artist => (
              <ArtistCard
                key={artist.id}
                id={artist.id}
                name={artist.full_name || artist.username || 'Unknown Artist'}
                image={artist.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.full_name || artist.username || "Artist")}&background=random`}
                followers={artist.follower_count}
                tracks={artist.tracks}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No artists found matching your search.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setSortBy('followers');
                  setVerifiedOnly('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ArtistsPage;
