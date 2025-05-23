
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistCard } from "@/components/ui/playlist-card";

// Mock playlists for demonstration
const mockPlaylists = [
  {
    id: '1',
    title: 'Workout Mix',
    description: 'High energy tracks to keep you motivated',
    coverImage: 'https://picsum.photos/id/1025/300/300',
    trackCount: 12,
    createdBy: {
      name: 'MAUDIO Editorial',
      id: 'editorial'
    }
  },
  {
    id: '2',
    title: 'Chill Vibes',
    description: 'Relaxing beats for your evening',
    coverImage: 'https://picsum.photos/id/1059/300/300',
    trackCount: 18,
    createdBy: {
      name: 'MAUDIO Editorial',
      id: 'editorial'
    }
  },
  {
    id: '3',
    title: 'Focus Flow',
    description: 'Concentration-enhancing instrumentals',
    coverImage: 'https://picsum.photos/id/1060/300/300',
    trackCount: 15,
    createdBy: {
      name: 'MAUDIO Editorial',
      id: 'editorial'
    }
  },
  {
    id: '4',
    title: 'Weekend Party',
    description: 'Get the party started with these hits',
    coverImage: 'https://picsum.photos/id/1062/300/300',
    trackCount: 24,
    createdBy: {
      name: 'MAUDIO Editorial',
      id: 'editorial'
    }
  }
];

const PlaylistsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  
  const filteredPlaylists = mockPlaylists.filter(playlist => 
    playlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Playlists</h1>
            <p className="text-muted-foreground">
              Discover curated collections or create your own
            </p>
          </div>
          
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Playlist
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search playlists..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Editorial playlists */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">Editorial Playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredPlaylists.length > 0 ? (
              filteredPlaylists.map(playlist => (
                <PlaylistCard
                  key={playlist.id}
                  id={playlist.id}
                  title={playlist.title}
                  description={playlist.description}
                  cover={playlist.coverImage}
                  trackCount={playlist.trackCount}
                  createdBy={playlist.createdBy}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No playlists found matching your search.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* My Playlists - would show user's playlists when authentication is implemented */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">My Playlists</h2>
          <div className="bg-maudio-darker rounded-lg p-10 text-center">
            <p className="text-muted-foreground mb-4">Sign in to create and view your playlists</p>
            <Button>Sign In</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PlaylistsPage;
