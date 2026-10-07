import { useEffect, useState } from "react";
import MainLayout from "@web/components/layout/MainLayout";
import { HeroSection } from "@web/components/sections/HeroSection";
import { FeaturedTracks } from "@web/components/sections/FeaturedSection";
import { FeaturedAlbums } from "@web/components/sections/AlbumsSection";
import { RecentPlaysSection } from "@web/components/sections/RecentPlaysSection";
import { TrendingArtists, FeaturedPlaylists, PersonalizedRecommendations } from "@web/components/sections/RecommendedSection";
import { BrowseByGenre } from "@web/components/sections/GenreSection";
import { TopChartsSection } from "@web/components/sections/TopChartsSection";
import { SearchBar } from "@web/components/layout/SearchBar";
import { useIsMobile } from "@web/hooks/use-mobile";
import { MobileHomeHeader, type HomeFilter } from "@web/components/layout/MobileHomeHeader";
import { OfflineHomeSection } from "@web/components/sections/OfflineHomeSection";
import { MusicPreferencesCard } from "@web/components/profile/MusicPreferencesCard";
import { isOnline as checkOnline, onNetworkChange } from "@mobile";

const Index = () => {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<HomeFilter>("all");
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    let detach = () => {};
    checkOnline().then(setOnline).catch(() => {});
    onNetworkChange((on) => setOnline(on)).then((d) => { detach = d; });
    return () => { detach(); };
  }, []);

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

          {!online ? (
            <OfflineHomeSection />
          ) : (
          <>
          {/* Hero only on All */}
          {show("all") && <HeroSection />}
          {show("all") && <MusicPreferencesCard />}

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
          </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
