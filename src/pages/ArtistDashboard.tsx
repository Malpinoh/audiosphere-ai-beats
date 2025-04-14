
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
import { Button } from "@/components/ui/button"; // Added this import

export default function ArtistDashboard() {
  const { user, profile } = useAuth();
  
  // Redirect non-artists
  if (!user || !profile || profile.role !== 'artist') {
    return <Navigate to="/" replace />;
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <Card className="w-full md:w-auto">
            <CardHeader>
              <CardTitle>Artist Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ProfilePictureUploader size="lg" />
              <h2 className="text-xl font-bold mt-4">{profile.full_name}</h2>
              <p className="text-muted-foreground">@{profile.username || 'artist'}</p>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <a href="/account-settings">Edit Profile</a>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex-1">
            <DashboardHeader />
            <QuickStats />
          </div>
        </div>
        
        <DashboardTabs />
        
        <div className="grid md:grid-cols-2 gap-6">
          <InsightsSection />
          <PromotionSection />
        </div>
      </div>
    </MainLayout>
  );
}
