import MainLayout from "@/components/layout/MainLayout";
import { TrackCard } from "@/components/ui/track-card";
import { useTrending } from "@/hooks/use-trending";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Play, TrendingUp, Flame } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

export default function TrendingPage() {
  const { tracks, loading, error } = useTrending(100);
  const { setQueue, playTrack } = useMusicPlayer();

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setQueue(tracks);
      playTrack(tracks[0]);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Trending Header */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Flame className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                  <TrendingUp className="w-10 h-10" />
                  Trending Now
                </h1>
                <p className="text-lg opacity-90">
                  The hottest tracks making waves right now
                </p>
              </div>
            </div>
            
            {tracks.length > 0 && (
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handlePlayAll}
                  size="lg"
                  className="bg-white text-black hover:bg-white/90"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Play All
                </Button>
                <span className="text-white/80">{tracks.length} trending tracks</span>
              </div>
            )}
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Trending Info */}
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">How Trending Works</h2>
          <p className="text-muted-foreground mb-4">
            Our trending algorithm considers multiple factors to identify the hottest tracks:
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Velocity</h3>
                <p className="text-muted-foreground">Recent play growth</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Flame className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Engagement</h3>
                <p className="text-muted-foreground">Likes and comments</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Play className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Recency</h3>
                <p className="text-muted-foreground">Fresh releases</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Global Reach</h3>
                <p className="text-muted-foreground">Multi-regional popularity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Tracks */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load trending tracks. Please try again.</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No trending tracks</h3>
            <p className="text-muted-foreground">
              Check back later as new tracks start trending.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Trending Tracks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {tracks.map((track, index) => (
                <div key={track.id} className="relative">
                  <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
                    {index + 1}
                  </div>
                  <TrackCard
                    track={track}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}