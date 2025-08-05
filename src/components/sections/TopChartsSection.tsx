import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChartPlaylistCard } from "@/components/ui/chart-playlist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, TrendingUp, Globe, MapPin } from "lucide-react";
import { useMusicPlayer } from "@/contexts/music-player";

interface ChartTrack {
  id: string;
  title: string;
  artist: string;
  play_count: number;
  audio_file_path: string;
  cover_art_path: string;
  genre: string;
  mood: string;
  duration?: number;
  user_id: string;
  artist_profile_id?: string;
  like_count?: number;
  tags?: string[];
  published?: boolean;
  chart_position?: number;
}

export const TopChartsSection = () => {
  const [globalTop50, setGlobalTop50] = useState<ChartTrack[]>([]);
  const [regionalTop50, setRegionalTop50] = useState<ChartTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRegion, setUserRegion] = useState<string>('US');
  const { setQueue, playTrack } = useMusicPlayer();

  useEffect(() => {
    fetchChartData();
    detectUserRegion();
  }, []);

  const detectUserRegion = async () => {
    try {
      // Try to get user's region from our edge function
      const response = await supabase.functions.invoke('geo-location');
      if (response.data && response.data.country) {
        setUserRegion(response.data.country);
      }
    } catch (error) {
      console.error('Failed to detect region:', error);
      // Fallback to US
    }
  };

  const fetchChartData = async () => {
    try {
      setLoading(true);

      // Fetch global top 50
      const { data: globalCharts } = await supabase
        .rpc('get_chart_data', { view_name: 'global_charts' })
        .limit(50);

      if (globalCharts) {
        // Get track details for global charts
        const trackIds = globalCharts.map(chart => chart.track_id);
        const { data: globalTracks } = await supabase
          .from('tracks')
          .select('*')
          .in('id', trackIds)
          .eq('published', true);

        if (globalTracks) {
          // Sort tracks by chart position
          const sortedGlobalTracks = globalTracks
            .map(track => ({
              ...track,
              chart_position: globalCharts.findIndex(chart => chart.track_id === track.id) + 1
            }))
            .sort((a, b) => a.chart_position - b.chart_position)
            .slice(0, 50);

          setGlobalTop50(sortedGlobalTracks);
        }
      }

      // Fetch regional top 50
      const { data: regionalCharts } = await supabase
        .rpc('get_chart_data', { 
          view_name: 'regional_charts', 
          region_code: userRegion 
        })
        .limit(50);

      if (regionalCharts) {
        const trackIds = regionalCharts.map(chart => chart.track_id);
        const { data: regionalTracks } = await supabase
          .from('tracks')
          .select('*')
          .in('id', trackIds)
          .eq('published', true);

        if (regionalTracks) {
          const sortedRegionalTracks = regionalTracks
            .map(track => ({
              ...track,
              chart_position: regionalCharts.findIndex(chart => chart.track_id === track.id) + 1
            }))
            .sort((a, b) => a.chart_position - b.chart_position)
            .slice(0, 50);

          setRegionalTop50(sortedRegionalTracks);
        }
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const playChartPlaylist = (tracks: ChartTrack[], title: string) => {
    console.log(`Playing ${title} playlist with ${tracks.length} tracks`);
    // Convert to proper Track format
    const properTracks = tracks.map(track => ({
      ...track,
      like_count: track.like_count || 0,
      tags: track.tags || [],
      published: track.published ?? true
    }));
    setQueue(properTracks);
    if (properTracks.length > 0) {
      playTrack(properTracks[0]);
    }
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <div key={i} className="maudio-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Top Charts
          </h2>
        </div>
        <LoadingSkeleton />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Top Charts
        </h2>
        <Link to="/charts">
          <Button variant="outline" size="sm">
            View All Charts
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Top 50 */}
        <ChartPlaylistCard
          title="Global Top 50"
          description="The most played tracks worldwide"
          tracks={globalTop50.slice(0, 5)}
          totalTracks={globalTop50.length}
          icon={<Globe className="h-5 w-5" />}
          gradientFrom="from-blue-500"
          gradientTo="to-purple-600"
          onPlay={() => playChartPlaylist(globalTop50, "Global Top 50")}
          onViewAll={() => {/* Navigate to full chart */}}
        />

        {/* Regional Top 50 - Only show if not US */}
        {userRegion !== 'US' && (
          <ChartPlaylistCard
            title={`${userRegion} Top 50`}
            description={`Most played tracks in ${userRegion}`}
            tracks={regionalTop50.slice(0, 5)}
            totalTracks={regionalTop50.length}
            icon={<MapPin className="h-5 w-5" />}
            gradientFrom="from-green-500"
            gradientTo="to-teal-600"
            onPlay={() => playChartPlaylist(regionalTop50, `${userRegion} Top 50`)}
            onViewAll={() => {/* Navigate to regional chart */}}
          />
        )}
      </div>

      {/* Additional Chart Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="maudio-card p-4 bg-gradient-to-br from-orange-500/10 to-red-600/10 border-orange-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Global Top 100</h3>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => playChartPlaylist(globalTop50, "Global Top 100")}
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Extended global chart with 100 tracks
          </p>
          <div className="text-xs text-orange-600 font-medium">
            Updated hourly
          </div>
        </div>

        <div className="maudio-card p-4 bg-gradient-to-br from-pink-500/10 to-rose-600/10 border-pink-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Viral Tracks</h3>
            <Button size="sm" variant="ghost">
              <Play className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Tracks gaining momentum fast
          </p>
          <div className="text-xs text-pink-600 font-medium">
            Trending now
          </div>
        </div>

        <div className="maudio-card p-4 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Fresh Discoveries</h3>
            <Button size="sm" variant="ghost">
              <Play className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            New releases climbing the charts
          </p>
          <div className="text-xs text-cyan-600 font-medium">
            Last 7 days
          </div>
        </div>
      </div>
    </section>
  );
};