
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { PromotionSection } from "@/components/dashboard/PromotionSection";
import { ProfilePictureUploader } from "@/components/profile/ProfilePictureUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ArtistDashboard() {
  const { user, profile } = useAuth();
  
  // Redirect non-artists
  if (!user || !profile || profile.role !== 'artist') {
    return <Navigate to="/" replace />;
  }
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-slate-900/50">
        <div className="container py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-white">Artist Dashboard</h1>
            <p className="text-lg text-white/60">Manage your music and connect with your audience</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
            <Card className="w-full md:w-auto bg-black/40 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Artist Profile</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ProfilePictureUploader size="lg" />
                <h2 className="text-xl font-bold mt-4 text-white">{profile.full_name}</h2>
                <p className="text-white/60">@{profile.username || 'artist'}</p>
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <a href="/account-settings">Edit Profile</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex-1 w-full">
              <DashboardHeader />
              <QuickStats />
            </div>
          </div>
          
          <DashboardTabs />
          
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <InsightsSection />
            <PromotionSection />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
