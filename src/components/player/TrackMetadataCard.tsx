import { Track } from "@/types/track-types";
import { Card } from "@/components/ui/card";
import { formatTime } from "@/utils/formatTime";

interface Props {
  track: Track;
}

export function TrackMetadataCard({ track }: Props) {
  const releaseYear = track.uploaded_at ? new Date(track.uploaded_at).getFullYear() : null;
  const fields: Array<[string, string | number | null | undefined]> = [
    ["Title", track.title],
    ["Artist", track.artist],
    ["Album", track.album_name],
    ["Genre", track.genre],
    ["Release year", releaseYear],
    ["Duration", track.duration ? formatTime(track.duration) : null],
    ["Songwriters", (track as any).songwriters],
    ["Producer", (track as any).producer],
    ["Composer", (track as any).composer],
    ["Label", (track as any).label],
    ["ISRC", (track as any).isrc],
    ["Language", (track as any).language],
    ["Explicit", (track as any).explicit === true ? "Yes" : null],
  ].filter(([, v]) => v !== null && v !== undefined && v !== "") as Array<[string, string | number]>;

  return (
    <Card className="p-4 bg-card/50 backdrop-blur">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">About</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {fields.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-border/30 py-1.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground text-right truncate">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
