
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { PromotionSection } from "@/components/dashboard/PromotionSection";

export default function ArtistDashboard() {
  const { user, profile } = useAuth();
  
  // Redirect non-artists
  if (!user || !profile || profile.role !== 'artist') {
    return <Navigate to="/" replace />;
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <DashboardHeader />
        <QuickStats />
        <DashboardTabs />
        
        <div className="grid md:grid-cols-2 gap-6">
          <InsightsSection />
          <PromotionSection />
        </div>
      </div>
    </MainLayout>
  );
}
