
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Music, Globe } from "lucide-react";
import { AnalyticsTab } from "./AnalyticsTab";
import { TracksTab } from "./TracksTab";
import { AudienceTab } from "./AudienceTab";

export const DashboardTabs = () => {
  return (
    <Tabs defaultValue="analytics" className="mb-8">
      <TabsList className="mb-4">
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="tracks" className="flex items-center gap-2">
          <Music className="h-4 w-4" />
          My Tracks
        </TabsTrigger>
        <TabsTrigger value="audience" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Audience
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="analytics">
        <AnalyticsTab />
      </TabsContent>
      
      <TabsContent value="tracks">
        <TracksTab />
      </TabsContent>
      
      <TabsContent value="audience">
        <AudienceTab />
      </TabsContent>
    </Tabs>
  );
};
