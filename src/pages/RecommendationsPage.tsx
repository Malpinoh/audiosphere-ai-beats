
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { TrackCard } from "@/components/ui/track-card";
import { Section } from "@/components/sections/FeaturedSection";
import { 
  getRecommendedTracks, 
  getMoodBasedRecommendations,
  getGenreBasedRecommendations
} from "@/utils/recommendationEngine";
import { MoodSelector } from "@/components/upload/MoodSelector";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const RecommendationsPage = () => {
  const [personalizedTracks, setPersonalizedTracks] = useState<any[]>([]);
  const [moodTracks, setMoodTracks] = useState<any[]>([]);
  const [genreTracks, setGenreTracks] = useState<any[]>([]);
  const [selectedMood, setSelectedMood] = useState("chill");
  const [selectedGenre, setSelectedGenre] = useState("electronic");

  // Fetch personalized recommendations on initial load
  useEffect(() => {
    const recommended = getRecommendedTracks("user1", 5);
    setPersonalizedTracks(recommended);
  }, []);

  // Fetch mood-based recommendations when mood changes
  useEffect(() => {
    const moodBasedTracks = getMoodBasedRecommendations(selectedMood, 5);
    setMoodTracks(moodBasedTracks);
  }, [selectedMood]);

  // Fetch genre-based recommendations when genre changes
  useEffect(() => {
    const genreBasedTracks = getGenreBasedRecommendations(selectedGenre, 5);
    setGenreTracks(genreBasedTracks);
  }, [selectedGenre]);

  // Handle mood change
  const handleMoodChange = (mood: string) => {
    setSelectedMood(mood);
  };

  // Handle genre change
  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
  };

  // Available genres
  const genres = [
    { value: "electronic", label: "Electronic" },
    { value: "hip-hop", label: "Hip Hop" },
    { value: "rock", label: "Rock" },
    { value: "pop", label: "Pop" },
    { value: "jazz", label: "Jazz" },
    { value: "ambient", label: "Ambient" },
    { value: "folk", label: "Folk" },
    { value: "world", label: "World" },
    { value: "classical", label: "Classical" },
    { value: "lofi", label: "Lo-Fi" },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Recommendations</h1>
          <p className="text-muted-foreground">
            Personalized music based on your listening history, likes, and follows
          </p>
        </div>

        {/* Personalized recommendations */}
        <Section 
          title="For You" 
          subtitle="Tracks we think you'll love based on your activity"
        >
          {personalizedTracks.length > 0 ? (
            personalizedTracks.map(track => (
              <div key={track.id} className="min-w-[220px] max-w-[220px]">
                <TrackCard 
                  id={track.id} 
                  title={track.title} 
                  artist={track.artist} 
                  artistId={track.artistId} 
                  cover={track.cover} 
                  plays={track.plays} 
                />
              </div>
            ))
          ) : (
            <div className="w-full py-8 text-center text-muted-foreground">
              Start listening to tracks to get personalized recommendations
            </div>
          )}
        </Section>

        {/* Mood-based recommendations with selector */}
        <div className="mb-6 mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Based on Mood</h2>
              <p className="text-sm text-muted-foreground">Tracks that match your selected mood</p>
            </div>
            <div className="w-48">
              <MoodSelector value={selectedMood} onChange={handleMoodChange} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {moodTracks.length > 0 ? (
              moodTracks.map(track => (
                <TrackCard 
                  key={track.id}
                  id={track.id} 
                  title={track.title} 
                  artist={track.artist} 
                  artistId={track.artistId} 
                  cover={track.cover} 
                  plays={track.plays} 
                />
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                No tracks found for this mood
              </div>
            )}
          </div>
        </div>

        {/* Genre-based recommendations with selector */}
        <div className="mb-6 mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Based on Genre</h2>
              <p className="text-sm text-muted-foreground">Tracks that match your selected genre</p>
            </div>
            <div className="w-48">
              <Select onValueChange={handleGenreChange} value={selectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre.value} value={genre.value}>
                      {genre.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {genreTracks.length > 0 ? (
              genreTracks.map(track => (
                <TrackCard 
                  key={track.id}
                  id={track.id} 
                  title={track.title} 
                  artist={track.artist} 
                  artistId={track.artistId} 
                  cover={track.cover} 
                  plays={track.plays} 
                />
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                No tracks found for this genre
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RecommendationsPage;
