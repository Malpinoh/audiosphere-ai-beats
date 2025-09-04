import { useParams } from 'react-router-dom';
import { useState } from 'react';
import MainLayout from "@/components/layout/MainLayout";
import { TrackCard } from "@/components/ui/track-card";
import { useTracks } from "@/hooks/use-tracks";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Play, Music } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

// Genre metadata
const genreInfo = {
  "hip-hop": {
    name: "Hip Hop",
    description: "Discover the latest hip hop tracks, from conscious rap to trap beats",
    gradient: "from-yellow-500 to-orange-600"
  },
  "r-and-b": {
    name: "R&B",
    description: "Smooth R&B vibes and soulful melodies",
    gradient: "from-purple-600 to-pink-600"
  },
  "pop": {
    name: "Pop",
    description: "The biggest pop hits and emerging artists",
    gradient: "from-blue-500 to-cyan-400"
  },
  "electronic": {
    name: "Electronic",
    description: "Electronic beats and digital soundscapes",
    gradient: "from-emerald-500 to-lime-500"
  },
  "rock": {
    name: "Rock",
    description: "From classic rock to modern alternative",
    gradient: "from-red-600 to-orange-500"
  },
  "jazz": {
    name: "Jazz",
    description: "Smooth jazz and contemporary fusion",
    gradient: "from-amber-500 to-yellow-400"
  },
  "afrobeats": {
    name: "Afrobeats",
    description: "The pulse of Africa - Afrobeats, Afropop and more",
    gradient: "from-indigo-600 to-blue-500"
  },
  "latin": {
    name: "Latin",
    description: "Latin rhythms and tropical sounds",
    gradient: "from-orange-500 to-red-500"
  }
};

export default function GenrePage() {
  const { genreId } = useParams<{ genreId: string }>();
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('popular');
  const { setQueue, playTrack } = useMusicPlayer();
  
  const genre = genreId ? genreInfo[genreId as keyof typeof genreInfo] : null;
  
  // Fetch tracks based on sort option
  const getFilter = () => {
    const baseFilter = {
      published: true,
      genre: genre?.name,
      limit: 50
    };

    switch (sortBy) {
      case 'newest':
        return {
          ...baseFilter,
          orderBy: { column: 'uploaded_at' as const, ascending: false }
        };
      case 'trending':
        return {
          ...baseFilter,
          chartType: 'trending' as const
        };
      default:
        return {
          ...baseFilter,
          orderBy: { column: 'play_count' as const, ascending: false }
        };
    }
  };

  const { tracks, loading, error } = useTracks(getFilter());

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setQueue(tracks);
      playTrack(tracks[0]);
    }
  };

  if (!genre) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Genre Not Found</h1>
            <p className="text-muted-foreground">The requested genre could not be found.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Genre Header */}
        <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${genre.gradient} p-8 text-white`}>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Music className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{genre.name}</h1>
                <p className="text-lg opacity-90">{genre.description}</p>
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
                <span className="text-white/80">{tracks.length} tracks</span>
              </div>
            )}
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'popular' ? 'default' : 'outline'}
            onClick={() => setSortBy('popular')}
          >
            Popular
          </Button>
          <Button
            variant={sortBy === 'trending' ? 'default' : 'outline'}
            onClick={() => setSortBy('trending')}
          >
            Trending
          </Button>
          <Button
            variant={sortBy === 'newest' ? 'default' : 'outline'}
            onClick={() => setSortBy('newest')}
          >
            Newest
          </Button>
        </div>

        {/* Tracks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load tracks. Please try again.</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tracks found</h3>
            <p className="text-muted-foreground">
              No {genre.name.toLowerCase()} tracks available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}