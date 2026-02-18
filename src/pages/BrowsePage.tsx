import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTracks, TracksFilter } from "@/hooks/use-tracks";
import { TrackCard } from "@/components/ui/track-card";
import { GenreCard } from "@/components/ui/genre-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const genres = [
  { id: "hip-hop", name: "Hip Hop", image: "https://picsum.photos/id/1025/300/300", color: "from-yellow-500 to-orange-600" },
  { id: "r-and-b", name: "R&B", image: "https://picsum.photos/id/1059/300/300", color: "from-purple-600 to-pink-600" },
  { id: "pop", name: "Pop", image: "https://picsum.photos/id/325/300/300", color: "from-blue-500 to-cyan-400" },
  { id: "electronic", name: "Electronic", image: "https://picsum.photos/id/1060/300/300", color: "from-emerald-500 to-lime-500" },
  { id: "rock", name: "Rock", image: "https://picsum.photos/id/1062/300/300", color: "from-red-600 to-orange-500" },
  { id: "jazz", name: "Jazz", image: "https://picsum.photos/id/1074/300/300", color: "from-amber-500 to-yellow-400" },
  { id: "afrobeats", name: "Afrobeats", image: "https://picsum.photos/id/1080/300/300", color: "from-indigo-600 to-blue-500" },
  { id: "latin", name: "Latin", image: "https://picsum.photos/id/177/300/300", color: "from-orange-500 to-red-500" },
];

const moods = ["Energetic", "Relaxed", "Happy", "Sad", "Romantic", "Focused"];

const moodGradients: Record<string, string> = {
  energetic: "from-red-500 to-orange-400",
  relaxed: "from-blue-400 to-teal-400",
  happy: "from-yellow-400 to-amber-300",
  sad: "from-indigo-600 to-purple-600",
  romantic: "from-pink-500 to-red-400",
  focused: "from-green-500 to-emerald-400",
};

const BrowsePage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
  const [selectedGenre, setSelectedGenre] = useState<string>("all-genres");
  const [selectedMood, setSelectedMood] = useState<string>("all-moods");
  const [currentFilter, setCurrentFilter] = useState<TracksFilter>({ published: true, limit: 20 });
  const { tracks, loading } = useTracks(currentFilter);
  const isMobile = useIsMobile();

  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
      setCurrentFilter({ published: true, limit: 20, searchTerm: searchFromUrl });
    }
  }, [searchParams]);

  const handleSearch = () => {
    setCurrentFilter({
      published: true, limit: 20,
      searchTerm: searchTerm || undefined,
      genre: selectedGenre === "all-genres" ? undefined : selectedGenre,
      mood: selectedMood === "all-moods" ? undefined : selectedMood,
    });
  };

  const handleGenreClick = (genreId: string) => {
    setSelectedGenre(genreId);
    setCurrentFilter({ published: true, limit: 20, genre: genreId });
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-5`}>Browse</h1>

        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="genres">Genres</TabsTrigger>
            <TabsTrigger value="moods">Moods</TabsTrigger>
          </TabsList>

          {/* Search & Filters */}
          <div className={`mb-5 flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className={`${isMobile ? 'flex-1' : 'w-[140px]'}`}>
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-genres">All Genres</SelectItem>
                  {genres.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedMood} onValueChange={setSelectedMood}>
                <SelectTrigger className={`${isMobile ? 'flex-1' : 'w-[140px]'}`}>
                  <SelectValue placeholder="Mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-moods">All Moods</SelectItem>
                  {moods.map(m => <SelectItem key={m.toLowerCase()} value={m.toLowerCase()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} size={isMobile ? "default" : "default"}>Filter</Button>
            </div>
          </div>

          <TabsContent value="tracks" className="mt-0">
            {loading ? (
              <div className="space-y-2">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tracks.length > 0 ? (
              <div className="space-y-0.5">
                {tracks.map(track => <TrackCard key={track.id} track={track} variant="list" />)}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No tracks found.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedGenre('all-genres');
                    setSelectedMood('all-moods');
                    setCurrentFilter({ published: true, limit: 20 });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="genres" className="mt-0">
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-3 md:grid-cols-4 gap-4'}`}>
              {genres.map(genre => (
                <div key={genre.id} onClick={() => handleGenreClick(genre.id)} className="cursor-pointer">
                  <GenreCard {...genre} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="moods" className="mt-0">
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-3 md:grid-cols-4 gap-4'}`}>
              {moods.map(mood => (
                <div
                  key={mood}
                  className="cursor-pointer rounded-2xl overflow-hidden"
                  onClick={() => {
                    setSelectedMood(mood.toLowerCase());
                    setCurrentFilter({ published: true, limit: 20, mood: mood.toLowerCase() });
                  }}
                >
                  <div className={`bg-gradient-to-br ${moodGradients[mood.toLowerCase()] || 'from-primary to-secondary'} h-28 sm:h-36 flex items-center justify-center rounded-2xl`}>
                    <h3 className="text-lg font-bold text-white drop-shadow-md">{mood}</h3>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default BrowsePage;
