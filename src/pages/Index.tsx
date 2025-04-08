
import MainLayout from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturedTracks } from "@/components/sections/FeaturedSection";
import { TrendingArtists, FeaturedPlaylists, PersonalizedRecommendations } from "@/components/sections/RecommendedSection";
import { BrowseByGenre } from "@/components/sections/GenreSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, Flag } from "lucide-react";
import AdUnit from "@/components/ads/AdUnit";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  return (
    <MainLayout showTopAd={true} showSidebarAds={true}>
      <HeroSection />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Top leaderboard ad after hero section */}
        <div className="my-6 flex justify-center">
          <AdUnit size="leaderboard" />
        </div>
        
        <PersonalizedRecommendations />
        
        {/* Banner ad after recommendations */}
        <div className="my-6 flex justify-center">
          <AdUnit size="banner" />
        </div>
        
        <FeaturedTracks />
        <TrendingArtists />
        
        {/* Large rectangle ad between sections */}
        <div className="my-6 flex justify-center">
          <AdUnit size="large-rectangle" />
        </div>
        
        <BrowseByGenre />
        <FeaturedPlaylists />
        
        {/* Admin Panel Link - Only shown to admin users */}
        <div className="mt-10 border-t pt-8 flex justify-center gap-4">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          )}
          <Link to="/report">
            <Button variant="outline" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Report Content
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
