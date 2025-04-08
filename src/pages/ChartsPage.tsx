
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackCard } from "@/components/ui/track-card";
import { useTracks, useAvailableRegions, TracksFilter } from "@/hooks/use-tracks";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Trophy, TrendingUp } from "lucide-react";
import AdUnit from "@/components/ads/AdUnit";

// Loading card skeleton
const LoadingTrackCard = () => (
  <div className="min-w-[220px] max-w-[220px]">
    <div className="maudio-card overflow-hidden">
      <Skeleton className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
);

// Track ranking component
const TrackRanking = ({ rank, track }: { rank: number, track: any }) => {
  return (
    <div className="flex items-center gap-4 p-3 bg-maudio-darker rounded-md hover:bg-maudio-darker/80 transition-colors">
      <div className="text-2xl font-bold text-muted-foreground w-10 text-center">
        {rank}
      </div>
      
      <div className="h-16 w-16 rounded overflow-hidden shrink-0">
        <img 
          src={track.cover || track.cover_art_path} 
          alt={track.title}
          className="h-full w-full object-cover" 
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{track.title}</h3>
        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
      </div>
      
      <div className="text-right text-sm text-muted-foreground shrink-0">
        {track.play_count.toLocaleString()} plays
      </div>
    </div>
  );
};

const ChartsPage = () => {
  const [chartType, setChartType] = useState<'global' | 'regional'>('global');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const { regions, loading: loadingRegions } = useAvailableRegions();
  
  const filter: TracksFilter = chartType === 'global' 
    ? { chartType: 'global', limit: 100 }
    : { chartType: 'regional', region: selectedRegion, limit: 100 };
  
  const { tracks, loading } = useTracks(filter);
  
  // When regions load, set the first one as default if selectedRegion is empty
  useEffect(() => {
    if (!loadingRegions && regions.length > 0 && !selectedRegion) {
      setSelectedRegion(regions[0]);
    }
  }, [loadingRegions, regions, selectedRegion]);
  
  // Format the region name for display
  const formatRegionName = (code: string) => {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    try {
      return regionNames.of(code);
    } catch (e) {
      return code;
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-7 w-7 text-amber-400" />
              Music Charts
            </h1>
            <p className="text-muted-foreground">
              Real-time music ranking based on plays around the world
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={chartType === 'global' ? 'default' : 'outline'} 
              onClick={() => setChartType('global')}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Global
            </Button>
            <Button 
              variant={chartType === 'regional' ? 'default' : 'outline'} 
              onClick={() => setChartType('regional')}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Regional
            </Button>
          </div>
        </div>
        
        {/* Region selector (only visible for regional charts) */}
        {chartType === 'regional' && (
          <div className="mb-6">
            <div className="flex gap-2 items-center">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {loadingRegions ? (
                    <SelectItem value="loading-regions">Loading regions...</SelectItem>
                  ) : regions.length > 0 ? (
                    regions.map(region => (
                      <SelectItem key={region} value={region}>
                        {formatRegionName(region)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-regions">No regions available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Top leaderboard ad */}
        <div className="my-6 flex justify-center">
          <AdUnit size="leaderboard" />
        </div>
        
        {/* Chart content */}
        <div className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 text-base">
              {chartType === 'global' ? 'Global Top 100' : `${formatRegionName(selectedRegion)} Top 100`}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              Updated hourly
            </Badge>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {Array(10).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : tracks.length > 0 ? (
            <div className="space-y-2">
              {tracks.map((track, index) => (
                <TrackRanking key={track.id} rank={index + 1} track={track} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {chartType === 'regional' && selectedRegion 
                  ? `No chart data available for ${formatRegionName(selectedRegion)} yet.`
                  : 'No chart data available yet.'}
              </p>
            </div>
          )}
        </div>
        
        {/* Mid-content ad */}
        <div className="my-10 flex justify-center">
          <AdUnit size="large-rectangle" />
        </div>
        
        {/* Chart explanation */}
        <div className="mt-10 bg-maudio-darker p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">About MAUDIO Charts</h2>
          <p className="text-muted-foreground mb-4">
            Our charts are updated hourly and reflect the most played tracks across our platform. 
            The Global chart tracks worldwide plays, while Regional charts are based on plays from specific countries.
          </p>
          <p className="text-muted-foreground">
            Chart positions are determined by the number of plays a track receives over the past 7 days, 
            giving you a real-time view of what's trending in the music world.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChartsPage;
