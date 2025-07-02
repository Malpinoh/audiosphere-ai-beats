
import { Card, CardContent } from "@/components/ui/card";
import { Users, Play, Calendar, Music } from "lucide-react";
import { useArtistProfile } from "@/hooks/use-artist-profile";
import { useArtistTracks } from "@/hooks/use-artist-tracks";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ArtistStatsDisplayProps {
  artistId: string;
}

export function ArtistStatsDisplay({ artistId }: ArtistStatsDisplayProps) {
  const { artistProfile } = useArtistProfile(artistId);
  const { tracks } = useArtistTracks(artistId);
  const [realTimeStats, setRealTimeStats] = useState({
    totalPlays: 0,
    monthlyListeners: 0,
    followerCount: 0
  });

  useEffect(() => {
    const fetchRealTimeStats = async () => {
      try {
        // Get total plays across all tracks
        const totalPlays = tracks.reduce((sum, track) => sum + (track.play_count || 0), 0);

        // Get real follower count
        const { count: followerCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('artist_id', artistId);

        // Calculate monthly listeners from stream logs
        const { data: monthlyStreams } = await supabase
          .from('stream_logs')
          .select('user_id')
          .in('track_id', tracks.map(t => t.id))
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const uniqueListeners = new Set(
          monthlyStreams?.filter(s => s.user_id).map(s => s.user_id)
        ).size;

        setRealTimeStats({
          totalPlays,
          monthlyListeners: uniqueListeners,
          followerCount: followerCount || 0
        });
      } catch (error) {
        console.error('Error fetching real-time stats:', error);
      }
    };

    if (tracks.length > 0) {
      fetchRealTimeStats();
    }
  }, [artistId, tracks]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-black/20 border-white/10">
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold text-white">
            {formatNumber(realTimeStats.followerCount)}
          </div>
          <div className="text-xs text-white/60">Followers</div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/20 border-white/10">
        <CardContent className="p-4 text-center">
          <Play className="h-6 w-6 mx-auto mb-2 text-green-400" />
          <div className="text-2xl font-bold text-white">
            {formatNumber(realTimeStats.totalPlays)}
          </div>
          <div className="text-xs text-white/60">Total Plays</div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/20 border-white/10">
        <CardContent className="p-4 text-center">
          <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-400" />
          <div className="text-2xl font-bold text-white">
            {formatNumber(realTimeStats.monthlyListeners)}
          </div>
          <div className="text-xs text-white/60">Monthly Listeners</div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/20 border-white/10">
        <CardContent className="p-4 text-center">
          <Music className="h-6 w-6 mx-auto mb-2 text-pink-400" />
          <div className="text-2xl font-bold text-white">
            {tracks.length}
          </div>
          <div className="text-xs text-white/60">Tracks</div>
        </CardContent>
      </Card>
    </div>
  );
}
