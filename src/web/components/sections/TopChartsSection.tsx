import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@web/components/ui/button";
import { ChartPlaylistCard } from "@web/components/ui/chart-playlist-card";
import { Skeleton } from "@web/components/ui/skeleton";
import { TrendingUp, Globe, MapPin } from "lucide-react";
import { useMusicPlayer } from "@web/contexts/music-player";
import { useUserLocation } from "@web/hooks/use-user-location";
import { useTracks } from "@web/hooks/use-tracks";

type Period = "daily" | "weekly";

export const TopChartsSection = () => {
  const [period, setPeriod] = useState<Period>("weekly");
  const { location } = useUserLocation();
  const { playTracks } = useMusicPlayer();

  const { tracks: globalTracks, loading: globalLoading } = useTracks({
    chartType: "global",
    chartPeriod: period,
    limit: 50,
  });
  const { tracks: regionTracks, loading: regionLoading } = useTracks({
    chartType: "regional",
    chartPeriod: period,
    region: location?.country || "",
    limit: 50,
  });

  const formatRegionName = (code?: string) => {
    if (!code) return "";
    try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code; }
    catch { return code; }
  };

  const playList = (list: any[], name: string) => {
    if (!list.length) return;
    playTracks(list, 0, { kind: "charts", name });
  };

  const Loading = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {[1, 2].map((i) => (
        <div key={i} className="maudio-card p-6 space-y-3">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3].map((j) => (
            <div key={j} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const showRegion = !!location?.country && regionTracks.length > 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Top Charts
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            <Button
              size="sm"
              variant={period === "daily" ? "default" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => setPeriod("daily")}
            >
              Daily
            </Button>
            <Button
              size="sm"
              variant={period === "weekly" ? "default" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => setPeriod("weekly")}
            >
              Weekly
            </Button>
          </div>
          <Link to="/charts">
            <Button variant="outline" size="sm">View all</Button>
          </Link>
        </div>
      </div>

      {globalLoading || regionLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          {globalTracks.length > 0 && (
            <ChartPlaylistCard
              title={`Global ${period === "daily" ? "Daily" : "Weekly"} Top`}
              description={`Most streamed worldwide · updated live`}
              tracks={globalTracks.slice(0, 5) as any}
              totalTracks={globalTracks.length}
              icon={<Globe className="h-5 w-5" />}
              gradientFrom="from-blue-500"
              gradientTo="to-purple-600"
              onPlay={() => playList(globalTracks, `Global ${period} chart`)}
              onViewAll={() => {}}
            />
          )}
          {showRegion && (
            <ChartPlaylistCard
              title={`${formatRegionName(location?.country)} ${period === "daily" ? "Daily" : "Weekly"} Top`}
              description={`Trending in your region`}
              tracks={regionTracks.slice(0, 5) as any}
              totalTracks={regionTracks.length}
              icon={<MapPin className="h-5 w-5" />}
              gradientFrom="from-green-500"
              gradientTo="to-emerald-600"
              onPlay={() => playList(regionTracks, `${formatRegionName(location?.country)} ${period} chart`)}
              onViewAll={() => {}}
            />
          )}
        </div>
      )}

      <div className="text-center py-4 bg-maudio-darker/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Live rankings synced with the Charts page ·
          <span className="text-primary"> Powered by MAUDIO</span>
        </p>
      </div>
    </section>
  );
};