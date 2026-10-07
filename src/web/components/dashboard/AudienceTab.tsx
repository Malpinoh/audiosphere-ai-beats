import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@web/components/ui/card";
import { LineChart, PieChart } from "@web/components/charts";
import type { ArtistStats } from "@web/hooks/use-artist-stats";

export const AudienceTab = ({ stats }: { stats: ArtistStats | null }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Follower Growth</CardTitle><CardDescription>Total followers, last 30 days</CardDescription></CardHeader>
      <CardContent><div className="h-[280px]">
        {stats?.followers ? <LineChart data={stats.follower_daily} categories={["followers"]} index="date" colors={["primary"]} />
          : <p className="h-full flex items-center justify-center text-sm text-muted-foreground">No followers yet.</p>}
      </div></CardContent>
    </Card>
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Top Cities</CardTitle><CardDescription>Last 30 days</CardDescription></CardHeader>
        <CardContent>
          {stats?.cities.length ? (
            <ul className="space-y-2">
              {stats.cities.map((c) => (
                <li key={c.name + c.country} className="flex justify-between text-sm">
                  <span>{c.name}{c.country ? `, ${c.country}` : ""}</span>
                  <span className="font-medium">{c.streams.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No city data yet.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Devices</CardTitle><CardDescription>How people listen</CardDescription></CardHeader>
        <CardContent><div className="h-[200px]">
          {stats?.devices.length ? <PieChart data={stats.devices} category="streams" index="name" />
            : <p className="text-sm text-muted-foreground">No device data yet.</p>}
        </div></CardContent>
      </Card>
    </div>
  </div>
);
