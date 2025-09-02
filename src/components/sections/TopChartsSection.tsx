import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChartPlaylistCard } from "@/components/ui/chart-playlist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Globe, MapPin } from "lucide-react";
import { useMusicPlayer } from "@/contexts/music-player";
import { useUserLocation } from "@/hooks/use-user-location";

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

interface RegionalPlaylist {
  id: string;
  title: string;
  description: string;
  track_count: number;
  region_code: string;
  region_name: string;
  tracks: ChartTrack[];
}

export const TopChartsSection = () => {
  const [globalTop50, setGlobalTop50] = useState<ChartTrack[]>([]);
  const [regionalPlaylists, setRegionalPlaylists] = useState<RegionalPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const { setQueue, playTrack } = useMusicPlayer();
  const { location } = useUserLocation();

  useEffect(() => {
    fetchChartData();
  }, [location]);

  const fetchChartData = async () => {
    try {
      setLoading(true);

      // Fetch auto-generated regional playlists
      const { data: playlists } = await supabase
        .from('playlists')
        .select(`
          id,
          title,
          description,
          playlist_tracks!inner(
            position,
            track:tracks!inner(
              id,
              title,
              artist,
              play_count,
              audio_file_path,
              cover_art_path,
              genre,
              mood,
              duration,
              user_id,
              artist_profile_id,
              like_count,
              tags,
              published
            )
          )
        `)
        .eq('is_editorial', true)
        .or('title.ilike.%Top%Songs,title.eq.Global Top 50')
        .order('title');

      if (playlists) {
        const formattedPlaylists: RegionalPlaylist[] = playlists.map(playlist => ({
          id: playlist.id,
          title: playlist.title,
          description: playlist.description || '',
          track_count: playlist.playlist_tracks?.length || 0,
          region_code: extractRegionCode(playlist.title),
          region_name: extractRegionName(playlist.title),
          tracks: (playlist.playlist_tracks || [])
            .sort((a, b) => a.position - b.position)
            .map((pt, index) => ({
              ...pt.track,
              chart_position: index + 1
            }))
        }));

        // Separate global and regional playlists
        const globalPlaylist = formattedPlaylists.find(p => p.title === 'Global Top 50');
        const regionalPlaylistsData = formattedPlaylists.filter(p => p.title !== 'Global Top 50');

        if (globalPlaylist) {
          setGlobalTop50(globalPlaylist.tracks);
        }

        setRegionalPlaylists(regionalPlaylistsData);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractRegionCode = (title: string): string => {
    // Extract region code from playlist title
    if (title === 'Global Top 50') return 'GLOBAL';
    const match = title.match(/Top \d+ (.+?) Songs/);
    return match ? match[1].toUpperCase() : '';
  };

  const extractRegionName = (title: string): string => {
    if (title === 'Global Top 50') return 'Global';
    const match = title.match(/Top \d+ (.+?) Songs/);
    return match ? match[1] : '';
  };

  const playChartPlaylist = (tracks: ChartTrack[], title: string) => {
    console.log(`Playing ${title} playlist with ${tracks.length} tracks`);
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
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
            Regional Charts
          </h2>
        </div>
        <LoadingSkeleton />
      </section>
    );
  }

  // Get user's regional playlist and other popular regions
  const userRegionPlaylist = location ? 
    regionalPlaylists.find(p => p.region_name.toLowerCase() === location.country.toLowerCase() || 
                              p.region_code === location.country) : null;
  
  const popularRegions = ['Nigeria', 'Ghana', 'United Kingdom', 'South Africa', 'Kenya'];
  const featuredPlaylists = regionalPlaylists.filter(p => 
    popularRegions.includes(p.region_name) || 
    (userRegionPlaylist && p.id === userRegionPlaylist.id)
  ).slice(0, 6);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Regional Charts
        </h2>
        <Link to="/charts">
          <Button variant="outline" size="sm">
            View All Charts
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Global Top 50 */}
        {globalTop50.length > 0 && (
          <ChartPlaylistCard
            title="Global Top 50"
            description="Most streamed worldwide - Updated daily"
            tracks={globalTop50.slice(0, 5)}
            totalTracks={globalTop50.length}
            icon={<Globe className="h-5 w-5" />}
            gradientFrom="from-blue-500"
            gradientTo="to-purple-600"
            onPlay={() => playChartPlaylist(globalTop50, "Global Top 50")}
            onViewAll={() => {}}
          />
        )}

        {/* User's Region (if available) */}
        {userRegionPlaylist && (
          <ChartPlaylistCard
            title={userRegionPlaylist.title}
            description={`Popular in your region - ${userRegionPlaylist.track_count} tracks`}
            tracks={userRegionPlaylist.tracks.slice(0, 5)}
            totalTracks={userRegionPlaylist.track_count}
            icon={<MapPin className="h-5 w-5" />}
            gradientFrom="from-green-500"
            gradientTo="to-emerald-600"
            onPlay={() => playChartPlaylist(userRegionPlaylist.tracks, userRegionPlaylist.title)}
            onViewAll={() => {}}
          />
        )}

        {/* Featured Regional Playlists */}
        {featuredPlaylists
          .filter(p => !userRegionPlaylist || p.id !== userRegionPlaylist.id)
          .slice(0, userRegionPlaylist ? 4 : 5)
          .map((playlist, index) => {
            const gradients = [
              { from: "from-orange-500", to: "to-red-600" },
              { from: "from-pink-500", to: "to-rose-600" },
              { from: "from-cyan-500", to: "to-blue-600" },
              { from: "from-purple-500", to: "to-indigo-600" },
              { from: "from-yellow-500", to: "to-orange-600" },
            ];
            const gradient = gradients[index % gradients.length];

            return (
              <ChartPlaylistCard
                key={playlist.id}
                title={playlist.title}
                description={`${playlist.track_count} trending tracks`}
                tracks={playlist.tracks.slice(0, 5)}
                totalTracks={playlist.track_count}
                icon={<MapPin className="h-5 w-5" />}
                gradientFrom={gradient.from}
                gradientTo={gradient.to}
                onPlay={() => playChartPlaylist(playlist.tracks, playlist.title)}
                onViewAll={() => {}}
              />
            );
          })}
      </div>

      {/* Additional Info */}
      <div className="text-center py-4 bg-maudio-darker/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          🌍 Regional charts update daily • 
          <span className="text-primary"> Powered by MAUDIO</span>
        </p>
      </div>
    </section>
  );
};