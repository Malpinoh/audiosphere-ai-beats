
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
        const totalPlays = tracks.reduce((sum, track) => sum + (track.play_count || 0), 0);

        const { count: followerCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('artist_id', artistId);

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

  const stats = [
    { icon: Users, value: realTimeStats.followerCount, label: "Followers", color: "text-primary" },
    { icon: Play, value: realTimeStats.totalPlays, label: "Total Plays", color: "text-green-500" },
    { icon: Calendar, value: realTimeStats.monthlyListeners, label: "Monthly Listeners", color: "text-purple-500" },
    { icon: Music, value: tracks.length, label: "Tracks", color: "text-pink-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      {stats.map(({ icon: Icon, value, label, color }) => (
        <Card key={label} className="bg-card border-border">
          <CardContent className="p-3 md:p-4 text-center">
            <Icon className={`h-5 w-5 md:h-6 md:w-6 mx-auto mb-1.5 md:mb-2 ${color}`} />
            <div className="text-xl md:text-2xl font-bold text-foreground">
              {formatNumber(value)}
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground">{label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
