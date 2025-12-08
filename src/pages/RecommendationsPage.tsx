import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { TrackCard } from "@/components/ui/track-card";
import { Section } from "@/components/sections/FeaturedSection";
import { 
  usePersonalizedRecommendations,
  useMoodRecommendations,
  useGenreRecommendations
} from "@/hooks/use-recommendations";
import { getAvailableGenres } from "@/utils/recommendationEngine";
import { MoodSelector } from "@/components/upload/MoodSelector";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const RecommendationsPage = () => {
  const [selectedMood, setSelectedMood] = useState("chill");
  const [selectedGenre, setSelectedGenre] = useState("afrobeats");
  const [genres, setGenres] = useState<{ value: string; label: string }[]>([]);

  // Use the new recommendation hooks
  const { tracks: personalizedTracks, loading: personalizedLoading } = usePersonalizedRecommendations(10);
  const { tracks: moodTracks, loading: moodLoading } = useMoodRecommendations(selectedMood, 5);
  const { tracks: genreTracks, loading: genreLoading } = useGenreRecommendations(selectedGenre, 5);

  // Fetch available genres
  useEffect(() => {
    async function loadGenres() {
      const availableGenres = await getAvailableGenres();
      setGenres(availableGenres.map(g => ({
        value: g,
        label: g.charAt(0).toUpperCase() + g.slice(1).replace(/-/g, ' ')
      })));
    }
    loadGenres();
  }, []);

  // Handle mood change
  const handleMoodChange = (mood: string) => {
    setSelectedMood(mood);
  };

  // Handle genre change
  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
  };

  // Convert track data to match the Track interface
  const formatTrackForCard = (trackData: any) => {
    return {
      id: trackData.id,
      title: trackData.title,
      artist: trackData.artist,
      cover_art_path: trackData.cover,
      audio_file_path: "",
      genre: trackData.genre || "",
      mood: trackData.mood || "",
      play_count: trackData.plays || 0,
      like_count: 0,
      tags: [],
      published: true,
      cover: trackData.cover,
      user_id: trackData.artistId || "unknown",
      duration: 0
    };
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

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
          {personalizedLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="min-w-[220px] space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : personalizedTracks.length > 0 ? (
            personalizedTracks.map(trackData => (
              <div key={trackData.id} className="min-w-[220px] max-w-[220px]">
                <TrackCard track={formatTrackForCard(trackData)} />
                {trackData.reason && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {trackData.reason}
                  </p>
                )}
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
          
          {moodLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {moodTracks.length > 0 ? (
                moodTracks.map(trackData => (
                  <TrackCard 
                    key={trackData.id}
                    track={formatTrackForCard(trackData)}
                  />
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  No tracks found for this mood
                </div>
              )}
            </div>
          )}
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
          
          {genreLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {genreTracks.length > 0 ? (
                genreTracks.map(trackData => (
                  <TrackCard 
                    key={trackData.id}
                    track={formatTrackForCard(trackData)}
                  />
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  No tracks found for this genre
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default RecommendationsPage;
