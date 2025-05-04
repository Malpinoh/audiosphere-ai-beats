import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Music, 
  PlayCircle, 
  ThumbsUp,
  Users,
  Loader2 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface StatsData {
  tracks: number;
  plays: number;
  likes: number;
  followers: number;
}

export function QuickStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    tracks: 0,
    plays: 0,
    likes: 0,
    followers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistStats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // We can now directly use user.id instead of looking for a distributor record
        const userId = user.id;
        
        // Get track count
        const { count: trackCount, error: trackError } = await supabase
          .from('tracks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
          
        // Get total plays
        const { data: tracksData, error: tracksDataError } = await supabase
          .from('tracks')
          .select('id, play_count')
          .eq('user_id', userId);
          
        // Get total likes
        const { data: likesData, error: likesDataError } = await supabase
          .from('tracks')
          .select('like_count')
          .eq('user_id', userId);
          
        // Calculate stats
        let totalPlays = 0;
        let totalLikes = 0;
        
        if (!tracksDataError && tracksData) {
          totalPlays = tracksData.reduce((sum, track) => sum + (track.play_count || 0), 0);
        }
        
        if (!likesDataError && likesData) {
          totalLikes = likesData.reduce((sum, track) => sum + (track.like_count || 0), 0);
        }
        
        // Get follower count (if implemented)
        // This is a placeholder - update when followers table is implemented
        const followerCount = Math.floor(totalPlays / 10); // Placeholder calculation
        
        setStats({
          tracks: trackCount || 0,
          plays: totalPlays,
          likes: totalLikes,
          followers: followerCount
        });
      } catch (error) {
        console.error("Error fetching artist stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtistStats();
    
    // Setup real-time listener for tracks
    const channel = supabase
      .channel('artist-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks'
        },
        () => {
          fetchArtistStats();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-muted h-7 w-16 rounded"></div>
              <p className="text-xs text-muted-foreground mt-1">Loading data...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
          <Music className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.tracks}</div>
          <p className="text-xs text-muted-foreground">
            Songs uploaded to your profile
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
          <PlayCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.plays.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Streams across all tracks
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
          <ThumbsUp className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.likes.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Likes across all tracks
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Followers</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.followers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            People following your profile
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
