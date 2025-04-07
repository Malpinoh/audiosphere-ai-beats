
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Heart, Play, Share, Users } from "lucide-react";
import AdUnit from "@/components/ads/AdUnit";

// Mock data for an artist profile
const mockArtist = {
  id: "1",
  name: "Luna Echo",
  bio: "Electronic music producer and vocalist known for ethereal soundscapes and hypnotic beats. Luna Echo has been crafting immersive sonic experiences since 2018, blending ambient textures with driving rhythms.",
  followers: 1248000,
  tracks: 27,
  image: "https://picsum.photos/id/64/300/300",
  coverImage: "https://picsum.photos/id/1047/1920/1080",
};

const ArtistProfile = () => {
  const { artistId } = useParams<{ artistId: string }>();

  // In a real app, you would fetch the artist data based on the artistId
  // For this example, we'll just use the mock data
  const artist = mockArtist;

  return (
    <MainLayout showSidebarAds={true}>
      {/* Artist Header */}
      <div className="relative h-[300px] overflow-hidden bg-maudio-darker">
        {/* Cover Image */}
        <div className="absolute inset-0 opacity-40">
          <img 
            src={artist.coverImage} 
            alt={artist.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-maudio-dark via-transparent to-transparent"></div>
        
        {/* Top banner ad */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <AdUnit size="banner" />
        </div>
        
        {/* Artist Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-6">
          <Avatar className="h-32 w-32 rounded-full border-4 border-white/10">
            <img src={artist.image} alt={artist.name} />
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">{artist.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {artist.followers.toLocaleString()} followers
              </span>
              <span>{artist.tracks} tracks</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <Button className="gap-2 maudio-gradient-bg">
              <Play className="h-4 w-4" />
              Play All
            </Button>
            <Button variant="outline" className="gap-2">
              <Heart className="h-4 w-4" />
              Follow
            </Button>
            <Button variant="outline" size="icon">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Tabs defaultValue="tracks">
          <TabsList className="mb-6">
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tracks" className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Popular Tracks</h2>
            
            {/* Mid-content ad */}
            <div className="my-6 flex justify-center">
              <AdUnit size="large-rectangle" />
            </div>
            
            {/* Tracks would go here */}
            <div className="text-muted-foreground text-center p-12">
              Track listing would appear here
            </div>
          </TabsContent>
          
          <TabsContent value="albums">
            <h2 className="text-xl font-bold mb-4">Albums & EPs</h2>
            
            {/* Albums would go here */}
            <div className="text-muted-foreground text-center p-12">
              Albums would appear here
            </div>
          </TabsContent>
          
          <TabsContent value="about">
            <h2 className="text-xl font-bold mb-4">About {artist.name}</h2>
            <p className="text-muted-foreground mb-6">{artist.bio}</p>
            
            {/* Bottom banner ad */}
            <div className="my-6 flex justify-center">
              <AdUnit size="leaderboard" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ArtistProfile;
