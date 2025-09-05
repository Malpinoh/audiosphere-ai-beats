
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { PromotionSection } from "@/components/dashboard/PromotionSection";
import { ArtistProfileEditor } from "@/components/artist/ArtistProfileEditor";
import { EarningsDashboard } from "@/components/royalty/EarningsDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, BarChart3 } from "lucide-react";

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
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <ArtistProfileEditor />
            
            <div className="space-y-6">
              <DashboardHeader />
              <QuickStats />
            </div>
          </div>
          
          <Tabs defaultValue="analytics" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Earnings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics">
              <DashboardTabs />
            </TabsContent>
            
            <TabsContent value="earnings">
              <EarningsDashboard />
            </TabsContent>
          </Tabs>
          
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <InsightsSection />
            <PromotionSection />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
