import MainLayout from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturedTracks } from "@/components/sections/FeaturedSection";
import { FeaturedAlbums } from "@/components/sections/AlbumsSection";
import { RecentPlaysSection } from "@/components/sections/RecentPlaysSection";
import { TrendingArtists, FeaturedPlaylists, PersonalizedRecommendations } from "@/components/sections/RecommendedSection";
import { BrowseByGenre } from "@/components/sections/GenreSection";
import { TopChartsSection } from "@/components/sections/TopChartsSection";

const Index = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-8 md:space-y-10">
          <HeroSection />
          <RecentPlaysSection />
          <PersonalizedRecommendations />
          
          <div className="space-y-10 md:space-y-12">
            <FeaturedTracks />
            <FeaturedAlbums />
            <TopChartsSection />
            <TrendingArtists />
            <BrowseByGenre />
            <FeaturedPlaylists />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
