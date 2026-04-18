import { Track } from "@/types/track-types";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Props {
  track: Track;
}

export function SongDnaCard({ track }: Props) {
  // Real values when present; otherwise show "—"
  const energy = (track as any).energy as number | undefined;
  const tempo = (track as any).tempo as number | undefined;
  const danceability = (track as any).danceability as number | undefined;
  // Popularity = play_count normalized (cap at 100k for the bar)
  const popularity = track.play_count
    ? Math.min(100, Math.round((track.play_count / 100000) * 100))
    : null;

  const Bar = ({ label, value, suffix }: { label: string; value: number | null | undefined; suffix?: string }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground tabular-nums">
          {value == null ? "—" : `${value}${suffix || ""}`}
        </span>
      </div>
      <Progress value={value == null ? 0 : Math.min(100, value)} className="h-1.5" />
    </div>
  );

  return (
    <Card className="p-4 bg-card/50 backdrop-blur space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Song DNA</h3>
      <div className="flex flex-wrap gap-1.5">
        {track.genre && <Badge variant="secondary">{track.genre}</Badge>}
        {track.mood && <Badge variant="outline">{track.mood}</Badge>}
        {track.tags?.slice(0, 4).map((t) => (
          <Badge key={t} variant="outline" className="text-xs">
            #{t}
          </Badge>
        ))}
      </div>
      <div className="space-y-3">
        <Bar label="Energy" value={energy ?? null} suffix="%" />
        <Bar label="Tempo" value={tempo ?? null} suffix=" BPM" />
        <Bar label="Danceability" value={danceability ?? null} suffix="%" />
        <Bar label="Popularity" value={popularity} suffix="%" />
      </div>
    </Card>
  );
}
