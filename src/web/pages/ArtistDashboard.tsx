import { Link } from "react-router-dom";
import MainLayout from "@web/components/layout/MainLayout";
import { DashboardHeader } from "@web/components/dashboard/DashboardHeader";
import { QuickStats } from "@web/components/dashboard/QuickStats";
import { DashboardTabs } from "@web/components/dashboard/DashboardTabs";
import { InsightsSection } from "@web/components/dashboard/InsightsSection";
import { PromotionSection } from "@web/components/dashboard/PromotionSection";
import { ArtistProfileEditor } from "@web/components/artist/ArtistProfileEditor";
import { EarningsDashboard } from "@web/components/royalty/EarningsDashboard";
import { Button } from "@web/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@web/components/ui/tabs";
import { DollarSign, BarChart3, ExternalLink } from "lucide-react";
import { useManagedArtists } from "@web/hooks/use-artist-account";
import { useArtistStats } from "@web/hooks/use-artist-stats";
import { ErrorState } from "@web/components/ui/error-state";

export default function ArtistDashboard() {
  const { managed } = useManagedArtists();
  const artistId = managed[0]?.artist_profile_id;
  const { stats, loading, error, reload } = useArtistStats(artistId);
  if (!artistId) return null; // route guard already redirects non-managers

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Artist Dashboard</h1>
            <p className="text-muted-foreground">Manage your music and connect with your audience</p>
          </div>
          <Button asChild variant="outline">
            <Link to={`/artist/${artistId}`}><ExternalLink className="h-4 w-4 mr-2" />My Artist Page</Link>
          </Button>
        </div>

        {error && <div className="mb-6"><ErrorState title="Couldn't load your stats" message={error} onRetry={reload} /></div>}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ArtistProfileEditor artistProfileId={artistId} />
          <div className="space-y-6">
            <DashboardHeader />
            <QuickStats stats={stats} loading={loading} />
          </div>
        </div>

        <Tabs defaultValue="analytics" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="analytics" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Earnings</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics"><DashboardTabs artistId={artistId} stats={stats} /></TabsContent>
          <TabsContent value="earnings"><EarningsDashboard /></TabsContent>
        </Tabs>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <InsightsSection stats={stats} loading={loading} />
          <PromotionSection artistId={artistId} />
        </div>
      </div>
    </MainLayout>
  );
}
