
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackCard } from "@/components/ui/track-card";
import type { Track } from "@/types/track-types";
import type { Artist } from "@/hooks/use-artist";

interface ArtistTabsProps {
  artist: Artist;
  tracks: Track[];
  tracksLoading: boolean;
}

export const ArtistTabs = ({ artist, tracks, tracksLoading }: ArtistTabsProps) => {
  return (
    <Tabs defaultValue="tracks">
      <TabsList className="mb-6">
        <TabsTrigger value="tracks">Tracks</TabsTrigger>
        <TabsTrigger value="albums">Albums</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
      </TabsList>
      
      <TabsContent value="tracks" className="space-y-4">
        <h2 className="text-xl font-bold mb-4">Popular Tracks</h2>
        
        {tracksLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading tracks...</span>
          </div>
        ) : tracks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} showArtist={false} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-center p-12">
            No tracks available from this artist yet
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="albums">
        <h2 className="text-xl font-bold mb-4">Albums & EPs</h2>
        
        {/* Albums would go here - for now a placeholder */}
        <div className="text-muted-foreground text-center p-12">
          No albums available from this artist yet
        </div>
      </TabsContent>
      
      <TabsContent value="about">
        <h2 className="text-xl font-bold mb-4">About {artist.full_name}</h2>
        <p className="text-muted-foreground mb-6">
          {artist.username ? `@${artist.username}` : artist.full_name} is an artist on MusicAudio.
        </p>
      </TabsContent>
    </Tabs>
  );
};
