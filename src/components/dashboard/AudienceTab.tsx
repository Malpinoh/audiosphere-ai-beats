
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, PieChart } from "@/components/charts";

export const AudienceTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audience Growth</CardTitle>
          <CardDescription>Track your follower growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <LineChart 
              data={[
                { date: "Jan", followers: 120 },
                { date: "Feb", followers: 240 },
                { date: "Mar", followers: 330 },
                { date: "Apr", followers: 520 },
                { date: "May", followers: 750 },
                { date: "Jun", followers: 920 },
                { date: "Jul", followers: 1050 },
                { date: "Aug", followers: 1254 },
              ]}
              categories={["followers"]}
              index="date"
              colors={["primary"]}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Listener Behavior</CardTitle>
            <CardDescription>Understand how people interact with your music</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Average Listen Time</h4>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-primary rounded-full w-[75%]"></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>0%</span>
                  <span className="font-medium">75% of track length</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Save Rate</h4>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-primary rounded-full w-[23%]"></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>0%</span>
                  <span className="font-medium">23% save music</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Playlist Addition Rate</h4>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-primary rounded-full w-[18%]"></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>0%</span>
                  <span className="font-medium">18% add to playlists</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Listening Sources</CardTitle>
            <CardDescription>Where your audience is discovering your music</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <PieChart 
                data={[
                  { source: "Direct Profile", value: 35 },
                  { source: "Search", value: 25 },
                  { source: "Playlists", value: 20 },
                  { source: "External Links", value: 15 },
                  { source: "Other", value: 5 },
                ]}
                category="value"
                index="source"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
