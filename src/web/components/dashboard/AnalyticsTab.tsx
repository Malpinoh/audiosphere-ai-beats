import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@web/components/ui/card";
import { LineChart, BarChart, PieChart } from "@web/components/charts";
import type { ArtistStats } from "@web/hooks/use-artist-stats";

const Empty = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center px-6">{text}</div>
);

export const AnalyticsTab = ({ stats }: { stats: ArtistStats | null }) => {
  const total = stats?.daily.reduce((s, d) => s + d.streams, 0) ?? 0;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Streams — last 30 days</CardTitle>
          <CardDescription>{total.toLocaleString()} streams · {(stats?.listeners ?? 0).toLocaleString()} listeners</CardDescription>
        </CardHeader>
        <CardContent><div className="h-[280px]">
          {total > 0 ? <LineChart data={stats!.daily} categories={["streams"]} index="date" colors={["primary"]} />
            : <Empty text="No streams in the last 30 days yet. Share your artist page to get your first listeners." />}
        </div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Top Tracks</CardTitle><CardDescription>Most streamed, last 30 days</CardDescription></CardHeader>
        <CardContent><div className="h-[260px]">
          {stats?.top_tracks.length ? <BarChart data={stats.top_tracks} categories={["streams"]} index="title" colors={["primary"]} />
            : <Empty text="Your top songs will show here once people start listening." />}
        </div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Countries</CardTitle><CardDescription>Where your streams come from</CardDescription></CardHeader>
        <CardContent><div className="h-[260px]">
          {stats?.countries.length ? <PieChart data={stats.countries} category="streams" index="name" />
            : <Empty text="No location data yet." />}
        </div></CardContent>
      </Card>
    </div>
  );
};
