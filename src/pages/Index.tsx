
import MainLayout from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturedTracks } from "@/components/sections/FeaturedSection";
import { TrendingArtists, FeaturedPlaylists, PersonalizedRecommendations } from "@/components/sections/RecommendedSection";
import { BrowseByGenre } from "@/components/sections/GenreSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  return (
    <MainLayout>
      <div className="min-h-screen">
        <HeroSection />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-12">
          {/* Personalized content for authenticated users */}
          <PersonalizedRecommendations />
          
          {/* Main content sections with Apple Music styling */}
          <div className="space-y-16">
            <FeaturedTracks />
            <TrendingArtists />
            <BrowseByGenre />
            <FeaturedPlaylists />
          </div>
          
          {/* Admin Panel Link - Only shown to admin users */}
          <div className="mt-16 border-t border-white/10 pt-8 flex justify-center gap-4">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <ShieldCheck className="h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            )}
            <Link to="/report">
              <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                <Flag className="h-4 w-4" />
                Report Content
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
