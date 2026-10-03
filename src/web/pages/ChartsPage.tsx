import { useState, useEffect } from "react";
import MainLayout from "@web/components/layout/MainLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@web/components/ui/select";
import { Button } from "@web/components/ui/button";
import { Skeleton } from "@web/components/ui/skeleton";
import { useTracks, TracksFilter } from "@web/hooks/use-tracks";
import { useAvailableRegions } from "@web/hooks/use-regions";
import { Badge } from "@web/components/ui/badge";
import { Globe, MapPin, Trophy, TrendingUp, Play } from "lucide-react";
import { useUserLocation } from "@web/hooks/use-user-location";
import { useMusicPlayer } from "@web/contexts/music-player";
import { useIsMobile } from "@web/hooks/use-mobile";

const TrackRanking = ({ rank, track }: { rank: number; track: any }) => {
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isMobile = useIsMobile();

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const getCoverUrl = (path: string) => {
    if (!path) return '/placeholder.svg';
    if (path.startsWith('http')) return path;
    return `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${path}`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer ${isCurrentTrack ? 'bg-primary/5' : ''}`}
      onClick={handlePlay}
    >
      <div className={`text-sm font-bold w-7 text-center flex-shrink-0 ${rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
        {rank}
      </div>
      <div className="h-11 w-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        <img
          src={getCoverUrl(track.cover_art_path || track.cover)}
          alt={track.title}
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-medium truncate ${isCurrentTrack ? 'text-primary' : 'text-foreground'}`}>{track.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>
      {!isMobile && (track.play_count || 0) >= 100 && (
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {(track.play_count || 0).toLocaleString()} plays
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); handlePlay(); }}
      >
        <Play className="h-4 w-4" />
      </Button>
    </div>
  );
};

const ChartsPage = () => {
  const [chartType, setChartType] = useState<'global' | 'regional'>('regional');
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const { regions, loading: loadingRegions } = useAvailableRegions();
  const { location, loading: locationLoading } = useUserLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (location && location.country && !selectedRegion) {
      setSelectedRegion(location.country);
    }
  }, [location, selectedRegion]);

  const filter: TracksFilter = chartType === 'global'
    ? { chartType: 'global', chartPeriod, limit: 100 }
    : { chartType: 'regional', chartPeriod, region: selectedRegion, limit: 100 };

  const { tracks, loading } = useTracks(filter);
  const { playTracks } = useMusicPlayer();
  const chartLabel = `${chartType === 'global' ? 'Global' : formatRegionName(selectedRegion)} ${chartPeriod === 'daily' ? 'Daily' : 'Weekly'}`;

  useEffect(() => {
    if (!loadingRegions && regions.length > 0 && !selectedRegion && !location) {
      setSelectedRegion(regions[0]);
    }
  }, [loadingRegions, regions, selectedRegion, location]);

  function formatRegionName(code: string) {
    if (!code) return 'Global';
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    try { return regionNames.of(code); } catch { return code; }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold flex items-center gap-2`}>
            <Trophy className="h-6 w-6 text-primary" />
            Charts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time rankings based on streams</p>
        </div>

        {/* Chart type toggle + region selector */}
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center gap-3'} mb-5`}>
          <div className="flex items-center gap-2">
            {locationLoading && (
              <Badge variant="outline" className="animate-pulse text-xs">Detecting...</Badge>
            )}
            {location && (
              <Badge variant="secondary" className="text-xs">📍 {formatRegionName(location.country)}</Badge>
            )}
            <Button
              variant={chartType === 'global' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('global')}
              className="gap-1.5"
            >
              <Globe className="h-3.5 w-3.5" />
              Global
            </Button>
            <Button
              variant={chartType === 'regional' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('regional')}
              className="gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5" />
              Regional
            </Button>
            <div className="mx-1 h-5 w-px bg-border" />
            <Button
              variant={chartPeriod === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartPeriod('daily')}
            >
              Daily
            </Button>
            <Button
              variant={chartPeriod === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartPeriod('weekly')}
            >
              Weekly
            </Button>
          </div>

          {chartType === 'regional' && (
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[200px]'}`}>
                <SelectValue placeholder="Select Region" />
              </SelectTrigger>
              <SelectContent>
                {loadingRegions ? (
                  <SelectItem value="loading-regions" disabled>Loading...</SelectItem>
                ) : regions.length > 0 ? (
                  regions.map(region => (
                    <SelectItem key={region} value={region}>{formatRegionName(region)}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-regions" disabled>No regions</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Chart badge */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="text-sm">
            {chartType === 'global' ? 'Global' : formatRegionName(selectedRegion)} · {chartPeriod === 'daily' ? 'Daily' : 'Weekly'} Top 100
          </Badge>
          <Button
            size="sm"
            className="ml-auto gap-1.5"
            disabled={loading || tracks.length === 0}
            onClick={() => playTracks(tracks as any, 0, { kind: 'charts', name: `${chartLabel} chart` })}
          >
            <Play className="h-3.5 w-3.5" />
            Play All
          </Button>
          <Badge variant="secondary" className="text-xs order-first sm:order-none">
            <TrendingUp className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>

        {/* Track list */}
        {loading ? (
          <div className="space-y-2">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5">
                <Skeleton className="h-5 w-7" />
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : tracks.length > 0 ? (
          <div className="space-y-0.5">
            {tracks.map((track, index) => (
              <TrackRanking key={track.id} rank={index + 1} track={track} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              {chartType === 'regional' && selectedRegion
                ? `No chart data for ${formatRegionName(selectedRegion)} yet.`
                : 'No chart data available yet.'}
            </p>
          </div>
        )}

        {/* About section */}
        <div className="mt-8 bg-muted/30 p-5 rounded-xl border border-border">
          <h2 className="text-lg font-bold mb-2">About MAUDIO Charts</h2>
          <p className="text-muted-foreground text-sm">
            Rankings are computed live from real streams. Daily charts cover the last 24 hours; weekly charts cover the last 7 days. The same data powers the home page charts section.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChartsPage;
