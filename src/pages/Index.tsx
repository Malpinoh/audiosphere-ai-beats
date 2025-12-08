import MainLayout from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturedTracks } from "@/components/sections/FeaturedSection";
import { FeaturedAlbums } from "@/components/sections/AlbumsSection";
import { RecentPlaysSection } from "@/components/sections/RecentPlaysSection";
import { TrendingArtists, FeaturedPlaylists, PersonalizedRecommendations } from "@/components/sections/RecommendedSection";
import { BrowseByGenre } from "@/components/sections/GenreSection";
import { TopChartsSection } from "@/components/sections/TopChartsSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, Flag, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-10">
          {/* Hero Section */}
          <HeroSection />
          
          {/* Recent Plays Section */}
          <RecentPlaysSection />
          
          {/* Personalized content for authenticated users */}
          <PersonalizedRecommendations />
          
          {/* Main content sections */}
          <div className="space-y-12">
            <FeaturedTracks />
            <FeaturedAlbums />
            <TopChartsSection />
            <TrendingArtists />
            <BrowseByGenre />
            <FeaturedPlaylists />
          </div>
          
          {/* Admin Panel Link - Only shown to admin users */}
          <div className="mt-16 border-t border-border pt-8 flex flex-wrap justify-center gap-3">
            {isAdmin && (
              <>
                <Link to="/admin">
                  <Button variant="outline" className="flex items-center gap-2 border-border/50 hover:bg-muted">
                    <ShieldCheck className="h-4 w-4" />
                    Admin Panel
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button variant="outline" className="flex items-center gap-2 border-border/50 hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    Upload Music
                  </Button>
                </Link>
              </>
            )}
            <Link to="/report">
              <Button variant="outline" className="flex items-center gap-2 border-border/50 hover:bg-muted">
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