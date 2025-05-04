
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Heart, Music, Play, Share, Users, Loader2 } from "lucide-react";
import { TrackCard } from "@/components/ui/track-card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTracks, Track } from "@/hooks/use-tracks";

interface Artist {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  follower_count: number;
  is_verified: boolean;
}

const ArtistProfile = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Fetch tracks by this artist
  const { tracks, loading: tracksLoading } = useTracks({
    published: true,
    artist: artist?.full_name || "",
    orderBy: { column: "play_count", ascending: false }
  });
  
  // Fetch artist data
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!artistId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', artistId)
          .single();
          
        if (error) {
          throw error;
        }
        
        setArtist(data as Artist);
        
        // Check if current user is following this artist
        if (user) {
          // This would require a followers table implementation
          // For now we'll use a placeholder
          setIsFollowing(false);
        }
      } catch (error) {
        console.error('Error fetching artist data:', error);
        toast.error('Failed to load artist profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtistData();
    
    // Set up real-time listener for follower count updates
    const channel = supabase
      .channel('artist-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${artistId}`
        },
        (payload) => {
          const updatedArtist = payload.new as Artist;
          setArtist(prevArtist => {
            if (!prevArtist) return updatedArtist;
            return { ...prevArtist, follower_count: updatedArtist.follower_count };
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistId, user]);
  
  const handleToggleFollow = async () => {
    if (!user) {
      toast.error('Please log in to follow artists');
      return;
    }
    
    // Toggle the UI state immediately for better UX
    setIsFollowing(prev => !prev);
    
    try {
      if (isFollowing) {
        // Unfollow logic would go here
        // This would require a followers table implementation
        toast.info('Unfollowed artist');
      } else {
        // Follow logic would go here
        // This would require a followers table implementation
        toast.success('Following artist');
      }
    } catch (error) {
      // Revert UI state on error
      setIsFollowing(prev => !prev);
      toast.error('Failed to update follow status');
    }
  };
  
  // Helper to get a placeholder image when avatar is missing
  const getAvatarImage = () => {
    if (artist?.avatar_url) return artist.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(artist?.full_name || "Artist")}&background=random`;
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading artist profile...</span>
        </div>
      </MainLayout>
    );
  }
  
  if (!artist) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <h2 className="text-2xl font-bold mb-2">Artist not found</h2>
          <p className="text-muted-foreground">The artist you're looking for doesn't exist or has been removed.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Artist Header */}
      <div className="relative h-[300px] overflow-hidden bg-maudio-darker">
        {/* Cover Image - Using a gradient as fallback */}
        <div className="absolute inset-0 opacity-40">
          {/* Use a placeholder gradient if no image */}
          <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-maudio-dark via-transparent to-transparent"></div>
        
        {/* Artist Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-6">
          <Avatar className="h-32 w-32 rounded-full border-4 border-white/10">
            <img src={getAvatarImage()} alt={artist.full_name} />
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-bold">{artist.full_name}</h1>
              {artist.is_verified && (
                <span className="bg-blue-500 text-white text-xs rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {artist.follower_count.toLocaleString()} followers
              </span>
              <span className="flex items-center gap-1">
                <Music className="h-4 w-4" />
                {tracks.length} tracks
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            {tracks.length > 0 && (
              <Button className="gap-2 maudio-gradient-bg">
                <Play className="h-4 w-4" />
                Play All
              </Button>
            )}
            <Button 
              variant={isFollowing ? "outline" : "default"}
              className={`gap-2 ${isFollowing ? "border-primary text-primary" : "maudio-gradient-bg"}`}
              onClick={handleToggleFollow}
            >
              <Heart className="h-4 w-4" fill={isFollowing ? "currentColor" : "none"} />
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button variant="outline" size="icon">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Tabs defaultValue="tracks">
          <TabsList className="mb-6">
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tracks" className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Popular Tracks</h2>
            
            {tracksLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading tracks...</span>
              </div>
            ) : tracks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {tracks.map((track) => (
                  <TrackCard key={track.id} track={track} showArtist={false} />
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-center p-12">
                No tracks available from this artist yet
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="albums">
            <h2 className="text-xl font-bold mb-4">Albums & EPs</h2>
            
            {/* Albums would go here - for now a placeholder */}
            <div className="text-muted-foreground text-center p-12">
              No albums available from this artist yet
            </div>
          </TabsContent>
          
          <TabsContent value="about">
            <h2 className="text-xl font-bold mb-4">About {artist.full_name}</h2>
            <p className="text-muted-foreground mb-6">
              {artist.username ? `@${artist.username}` : artist.full_name} is an artist on MusicAudio.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ArtistProfile;
