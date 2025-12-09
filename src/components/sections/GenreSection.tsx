import { useEffect, useState } from "react";
import { GenreCard } from "@/components/ui/genre-card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface GenreData {
  id: string;
  name: string;
  color: string;
  trackCount: number;
}

const genreColors: Record<string, string> = {
  "hip-hop": "from-amber-500 to-orange-600",
  "r-and-b": "from-purple-600 to-pink-600",
  "pop": "from-blue-500 to-cyan-400",
  "electronic": "from-emerald-500 to-teal-500",
  "rock": "from-red-600 to-orange-500",
  "jazz": "from-amber-400 to-yellow-500",
  "afrobeats": "from-green-500 to-emerald-600",
  "latin": "from-rose-500 to-pink-500",
  "gospel": "from-indigo-500 to-purple-500",
  "reggae": "from-yellow-500 to-green-500",
  "classical": "from-slate-500 to-gray-600",
  "country": "from-orange-400 to-amber-500",
};

export function BrowseByGenre() {
  const [genres, setGenres] = useState<GenreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const { data, error } = await supabase
          .from('tracks')
          .select('genre');

        if (error) throw error;

        // Count tracks per genre
        const genreCounts: Record<string, number> = {};
        data?.forEach(track => {
          const genre = track.genre?.toLowerCase() || 'other';
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });

        // Convert to array and sort by count
        const genreArray = Object.entries(genreCounts)
          .map(([name, count]) => ({
            id: name.replace(/\s+/g, '-').toLowerCase(),
            name: name.charAt(0).toUpperCase() + name.slice(1),
            color: genreColors[name.replace(/\s+/g, '-').toLowerCase()] || "from-primary to-secondary",
            trackCount: count,
          }))
          .sort((a, b) => b.trackCount - a.trackCount)
          .slice(0, 8);

        setGenres(genreArray);
      } catch (error) {
        console.error('Error fetching genres:', error);
        // Fallback to static genres
        setGenres([
          { id: "afrobeats", name: "Afrobeats", color: "from-green-500 to-emerald-600", trackCount: 0 },
          { id: "hip-hop", name: "Hip Hop", color: "from-amber-500 to-orange-600", trackCount: 0 },
          { id: "r-and-b", name: "R&B", color: "from-purple-600 to-pink-600", trackCount: 0 },
          { id: "pop", name: "Pop", color: "from-blue-500 to-cyan-400", trackCount: 0 },
          { id: "gospel", name: "Gospel", color: "from-indigo-500 to-purple-500", trackCount: 0 },
          { id: "reggae", name: "Reggae", color: "from-yellow-500 to-green-500", trackCount: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Browse by Genre</h2>
          <p className="text-muted-foreground mt-1">Explore music by categories</p>
        </div>
        <a 
          href="/browse" 
          className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          See all →
        </a>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))
        ) : (
          genres.map(genre => (
            <GenreCard 
              key={genre.id} 
              {...genre} 
            />
          ))
        )}
      </div>
    </section>
  );
}
