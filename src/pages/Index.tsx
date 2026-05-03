import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturedTracks } from "@/components/sections/FeaturedSection";
import { FeaturedAlbums } from "@/components/sections/AlbumsSection";
import { RecentPlaysSection } from "@/components/sections/RecentPlaysSection";
import { TrendingArtists, FeaturedPlaylists, PersonalizedRecommendations } from "@/components/sections/RecommendedSection";
import { BrowseByGenre } from "@/components/sections/GenreSection";
import { TopChartsSection } from "@/components/sections/TopChartsSection";
import { SearchBar } from "@/components/layout/SearchBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHomeHeader, type HomeFilter } from "@/components/layout/MobileHomeHeader";

const Index = () => {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<HomeFilter>("all");

  // Section visibility per filter (mobile only). Desktop always shows everything.
  const show = (f: HomeFilter) => !isMobile || filter === "all" || filter === f;

  return (
    <MainLayout hideMobileNavbar>
      <div className="min-h-screen bg-background">
        {isMobile && <MobileHomeHeader active={filter} onChange={setFilter} />}

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-8 md:space-y-10">
          {isMobile && (
            <SearchBar className="w-full" placeholder="Search songs, artists, genres..." />
          )}

          {/* Hero only on All */}
          {show("all") && <HeroSection />}

          {show("music") && <RecentPlaysSection />}
          {show("music") && <PersonalizedRecommendations />}

          <div className="space-y-10 md:space-y-12">
            {show("music") && <FeaturedTracks />}
            {show("music") && <FeaturedAlbums />}
            {show("music") && <TopChartsSection />}
            {show("music") && <TrendingArtists />}
            {show("genres") && <BrowseByGenre />}
            {show("playlists") && <FeaturedPlaylists />}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
