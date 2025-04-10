
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, BarChart, PieChart } from "@/components/charts";

export const AnalyticsTab = () => {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plays Over Time</CardTitle>
              <CardDescription>Track plays over the selected period</CardDescription>
            </div>
            <select 
              className="border border-border rounded px-3 py-1 text-sm" 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "week" | "month" | "year")}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <LineChart 
              data={[
                { date: "Mon", plays: 120 },
                { date: "Tue", plays: 240 },
                { date: "Wed", plays: 180 },
                { date: "Thu", plays: 350 },
                { date: "Fri", plays: 410 },
                { date: "Sat", plays: 320 },
                { date: "Sun", plays: 280 },
              ]}
              categories={["plays"]}
              index="date"
              colors={["primary"]}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Tracks</CardTitle>
          <CardDescription>Your most popular music</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <BarChart 
              data={[
                { track: "Summer Vibes", plays: 1240 },
                { track: "Midnight Dreams", plays: 980 },
                { track: "City Lights", plays: 750 },
                { track: "Mountain High", plays: 540 },
                { track: "Ocean Waves", plays: 320 },
              ]}
              categories={["plays"]}
              index="track"
              colors={["primary"]}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Audience Demographics</CardTitle>
          <CardDescription>Understand your listener base</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h4 className="mb-2 font-medium text-sm">Age Distribution</h4>
              <div className="h-[250px]">
                <PieChart 
                  data={[
                    { age: "18-24", value: 35 },
                    { age: "25-34", value: 45 },
                    { age: "35-44", value: 15 },
                    { age: "45+", value: 5 },
                  ]}
                  category="value"
                  index="age"
                />
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-sm">Regional Distribution</h4>
              <div className="h-[250px]">
                <PieChart 
                  data={[
                    { region: "North America", value: 55 },
                    { region: "Europe", value: 25 },
                    { region: "Asia", value: 15 },
                    { region: "Other", value: 5 },
                  ]}
                  category="value"
                  index="region"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
