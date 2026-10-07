import { Music, PlayCircle, ThumbsUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { Skeleton } from "@web/components/ui/skeleton";
import type { ArtistStats } from "@web/hooks/use-artist-stats";

export function QuickStats({ stats, loading }: { stats: ArtistStats | null; loading: boolean }) {
  const items = [
    { label: "Total Tracks", value: stats?.tracks, hint: "Songs on your artist page", icon: Music },
    { label: "Total Plays", value: stats?.plays, hint: "All-time streams", icon: PlayCircle },
    { label: "Total Likes", value: stats?.likes, hint: "Likes across your songs", icon: ThumbsUp },
    { label: "Followers", value: stats?.followers, hint: stats ? `+${stats.followers_7d} this week` : "", icon: Users },
  ];
  return (
    <div className="grid gap-4 grid-cols-2">
      {items.map(({ label, value, hint, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{(value ?? 0).toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground">{hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
