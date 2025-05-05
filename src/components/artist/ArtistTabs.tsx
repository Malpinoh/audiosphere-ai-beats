
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackCard } from "@/components/ui/track-card";
import type { Track } from "@/types/track-types";
import type { Artist } from "@/hooks/use-artist";
import { Card, CardContent } from "@/components/ui/card";

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
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            {artist.bio ? (
              <p className="text-muted-foreground mb-4">{artist.bio}</p>
            ) : (
              <p className="text-muted-foreground mb-4">
                {artist.username ? `@${artist.username}` : artist.full_name} is an artist on MusicAudio.
              </p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Username</h3>
                <p>{artist.username ? `@${artist.username}` : "Not provided"}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Follower Count</h3>
                <p>{artist.follower_count.toLocaleString()}</p>
              </div>
              
              {artist.website && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Website</h3>
                  <p>
                    <a 
                      href={artist.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {artist.website}
                    </a>
                  </p>
                </div>
              )}
              
              {artist.is_verified && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Status</h3>
                  <p className="flex items-center">
                    <span className="bg-blue-500 text-white text-xs rounded-full p-1 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Verified Artist
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
