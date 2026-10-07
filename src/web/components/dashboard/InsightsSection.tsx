import { Card, CardHeader, CardTitle, CardContent } from "@web/components/ui/card";
import { FileBarChart, TrendingUp, TrendingDown, MapPin, ListMusic, Sparkles } from "lucide-react";
import type { ArtistStats } from "@web/hooks/use-artist-stats";

interface Insight { icon: any; title: string; text: string }

function buildInsights(s: ArtistStats): Insight[] {
  const out: Insight[] = [];
  const { streams_7d: now, streams_prev_7d: prev } = s;
  if (now || prev) {
    const pct = prev ? Math.round(((now - prev) / prev) * 100) : 100;
    out.push({
      icon: pct >= 0 ? TrendingUp : TrendingDown,
      title: pct >= 0 ? `Streams up ${pct}% this week` : `Streams down ${Math.abs(pct)}% this week`,
      text: `${now.toLocaleString()} streams in the last 7 days vs ${prev.toLocaleString()} the week before.`,
    });
  }
  if (s.countries[0]) {
    const top = s.countries[0];
    const city = s.cities[0];
    out.push({ icon: MapPin, title: `Top market: ${top.name}`,
      text: `${top.streams.toLocaleString()} streams in 30 days${city ? `. Biggest city: ${city.name}.` : "."}` });
  }
  if (s.top_tracks[0]) out.push({ icon: Sparkles, title: `"${s.top_tracks[0].title}" leads`,
    text: `${s.top_tracks[0].streams.toLocaleString()} streams in 30 days — a good candidate to boost.` });
  const ed = s.placements.filter((p) => p.is_editorial).length;
  if (s.placements.length) out.push({ icon: ListMusic, title: `In ${s.placements.length} playlist${s.placements.length > 1 ? "s" : ""}`,
    text: ed ? `${ed} of them editorial.` : "None editorial yet — try pitching to the editorial team." });
  return out;
}

export const InsightsSection = ({ stats, loading }: { stats: ArtistStats | null; loading: boolean }) => {
  const insights = stats ? buildInsights(stats) : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileBarChart className="h-5 w-5 text-primary" />Performance Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No listening activity yet. Once people stream your music you'll see trends, top markets and playlist placements here.
          </p>
        ) : (
          <ul className="space-y-3">
            {insights.map((i) => (
              <li key={i.title} className="p-3 bg-muted/50 rounded-md flex">
                <div className="mr-4 mt-1 h-8 w-8 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center"><i.icon className="h-4 w-4" /></div>
                <div><h4 className="font-medium">{i.title}</h4><p className="text-sm text-muted-foreground">{i.text}</p></div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
