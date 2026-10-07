import { Tabs, TabsContent, TabsList, TabsTrigger } from "@web/components/ui/tabs";
import { BarChart3, Music, Globe } from "lucide-react";
import { AnalyticsTab } from "./AnalyticsTab";
import { TracksTab } from "./TracksTab";
import { AudienceTab } from "./AudienceTab";
import type { ArtistStats } from "@web/hooks/use-artist-stats";

export const DashboardTabs = ({ artistId, stats }: { artistId: string; stats: ArtistStats | null }) => (
  <Tabs defaultValue="analytics" className="mb-8">
    <TabsList className="mb-4">
      <TabsTrigger value="analytics" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Streams</TabsTrigger>
      <TabsTrigger value="tracks" className="flex items-center gap-2"><Music className="h-4 w-4" />My Tracks</TabsTrigger>
      <TabsTrigger value="audience" className="flex items-center gap-2"><Globe className="h-4 w-4" />Audience</TabsTrigger>
    </TabsList>
    <TabsContent value="analytics"><AnalyticsTab stats={stats} /></TabsContent>
    <TabsContent value="tracks"><TracksTab artistId={artistId} /></TabsContent>
    <TabsContent value="audience"><AudienceTab stats={stats} /></TabsContent>
  </Tabs>
);
