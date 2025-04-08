
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Section } from "@/components/sections/FeaturedSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTracks, TracksFilter } from "@/hooks/use-tracks";
import { TrackCard } from "@/components/ui/track-card";
import { GenreCard } from "@/components/ui/genre-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Search } from "lucide-react";
import AdUnit from "@/components/ads/AdUnit";

// Same mock data for genres from GenreSection
const genres = [
  {
    id: "hip-hop",
    name: "Hip Hop",
    image: "https://picsum.photos/id/1025/300/300",
    color: "from-yellow-500 to-orange-600"
  },
  {
    id: "r-and-b",
    name: "R&B",
    image: "https://picsum.photos/id/1059/300/300",
    color: "from-purple-600 to-pink-600"
  },
  {
    id: "pop",
    name: "Pop",
    image: "https://picsum.photos/id/325/300/300",
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: "electronic",
    name: "Electronic",
    image: "https://picsum.photos/id/1060/300/300",
    color: "from-emerald-500 to-lime-500"
  },
  {
    id: "rock",
    name: "Rock",
    image: "https://picsum.photos/id/1062/300/300",
    color: "from-red-600 to-orange-500"
  },
  {
    id: "jazz",
    name: "Jazz",
    image: "https://picsum.photos/id/1074/300/300",
    color: "from-amber-500 to-yellow-400"
  },
  {
    id: "afrobeats",
    name: "Afrobeats",
    image: "https://picsum.photos/id/1080/300/300",
    color: "from-indigo-600 to-blue-500"
  },
  {
    id: "latin",
    name: "Latin",
    image: "https://picsum.photos/id/177/300/300",
    color: "from-orange-500 to-red-500"
  }
];

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

const BrowsePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<TracksFilter>({
    published: true,
    limit: 20
  });
  
  const { tracks, loading } = useTracks(currentFilter);
  
  const handleSearch = () => {
    const newFilter: TracksFilter = {
      published: true,
      limit: 20,
      searchTerm: searchTerm || undefined,
      genre: selectedGenre || undefined,
      mood: selectedMood || undefined
    };
    
    setCurrentFilter(newFilter);
  };
  
  const handleGenreClick = (genreId: string) => {
    setSelectedGenre(genreId);
    
    const newFilter: TracksFilter = {
      published: true,
      limit: 20,
      genre: genreId
    };
    
    setCurrentFilter(newFilter);
  };
  
  // Available moods
  const moods = ["Energetic", "Relaxed", "Happy", "Sad", "Romantic", "Focused"];
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Browse Music</h1>
        
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="genres">Genres</TabsTrigger>
            <TabsTrigger value="moods">Moods</TabsTrigger>
          </TabsList>
          
          {/* Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, artist or description"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedGenre || ""} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre.id} value={genre.id}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedMood || ""} onValueChange={setSelectedMood}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moods</SelectItem>
                  {moods.map(mood => (
                    <SelectItem key={mood.toLowerCase()} value={mood.toLowerCase()}>
                      {mood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button onClick={handleSearch}>Filter</Button>
            </div>
          </div>
          
          {/* Leaderboard ad */}
          <div className="my-6 flex justify-center">
            <AdUnit size="leaderboard" />
          </div>
          
          <TabsContent value="tracks" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {loading ? (
                Array(10).fill(0).map((_, i) => (
                  <LoadingTrackCard key={i} />
                ))
              ) : tracks.length > 0 ? (
                tracks.map(track => (
                  <div key={track.id} className="min-w-[220px] max-w-[220px]">
                    <TrackCard 
                      id={track.id}
                      title={track.title}
                      artist={track.artist}
                      cover={track.cover || track.cover_art_path}
                      plays={track.play_count}
                      artistId="1" // This should be replaced with actual artist ID
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-muted-foreground">No tracks found matching your filters.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedGenre(null);
                      setSelectedMood(null);
                      setCurrentFilter({ published: true, limit: 20 });
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="genres" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {genres.map(genre => (
                <div key={genre.id} onClick={() => handleGenreClick(genre.id)} className="cursor-pointer">
                  <GenreCard {...genre} />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="moods" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {moods.map(mood => (
                <div 
                  key={mood} 
                  className="maudio-card overflow-hidden cursor-pointer"
                  onClick={() => {
                    setSelectedMood(mood.toLowerCase());
                    setCurrentFilter({
                      published: true,
                      limit: 20,
                      mood: mood.toLowerCase()
                    });
                  }}
                >
                  <div className={`bg-gradient-to-br from-${mood.toLowerCase() === 'energetic' ? 'red-500' : 
                                 mood.toLowerCase() === 'relaxed' ? 'blue-400' : 
                                 mood.toLowerCase() === 'happy' ? 'yellow-400' : 
                                 mood.toLowerCase() === 'sad' ? 'indigo-600' :
                                 mood.toLowerCase() === 'romantic' ? 'pink-500' : 'green-500'} 
                                 to-${mood.toLowerCase() === 'energetic' ? 'orange-400' : 
                                 mood.toLowerCase() === 'relaxed' ? 'teal-400' : 
                                 mood.toLowerCase() === 'happy' ? 'amber-300' : 
                                 mood.toLowerCase() === 'sad' ? 'purple-600' :
                                 mood.toLowerCase() === 'romantic' ? 'red-400' : 'emerald-400'} 
                                 h-40 flex items-center justify-center`}>
                    <h3 className="text-xl font-bold text-white">{mood}</h3>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Bottom banner ad */}
        <div className="mt-10 flex justify-center">
          <AdUnit size="banner" />
        </div>
      </div>
    </MainLayout>
  );
};

export default BrowsePage;
