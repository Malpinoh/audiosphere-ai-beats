
import MainLayout from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturedTracks } from "@/components/sections/FeaturedSection";
import { TrendingArtists, FeaturedPlaylists } from "@/components/sections/RecommendedSection";
import { BrowseByGenre } from "@/components/sections/GenreSection";

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <FeaturedTracks />
        <TrendingArtists />
        <BrowseByGenre />
        <FeaturedPlaylists />
      </div>
    </MainLayout>
  );
};

export default Index;
