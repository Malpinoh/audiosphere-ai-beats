import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Play, MoreHorizontal } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  cover_art_path: string;
  play_count?: number;
  chart_position?: number;
}

interface ChartPlaylistCardProps {
  title: string;
  description: string;
  tracks: Track[];
  totalTracks: number;
  icon: ReactNode;
  gradientFrom: string;
  gradientTo: string;
  onPlay: () => void;
  onViewAll: () => void;
}

export const ChartPlaylistCard = ({
  title,
  description,
  tracks,
  totalTracks,
  icon,
  gradientFrom,
  gradientTo,
  onPlay,
  onViewAll
}: ChartPlaylistCardProps) => {
  const getCoverArtUrl = (coverPath: string) => {
    if (!coverPath) return '/placeholder.svg';
    if (coverPath.startsWith('http')) return coverPath;
    return `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${coverPath}`;
  };

  const formatPlayCount = (count?: number) => {
    if (!count) return '';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className={`maudio-card p-6 bg-gradient-to-br ${gradientFrom}/10 ${gradientTo}/10 border-primary/20`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90`}
            onClick={onPlay}
          >
            <Play className="h-4 w-4 mr-1" />
            Play
          </Button>
          <Button size="sm" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Track List Preview */}
      <div className="space-y-3 mb-4">
        {tracks.slice(0, 5).map((track, index) => (
          <div key={track.id} className="flex items-center gap-3 group">
            {/* Chart Position */}
            <div className="w-6 text-center">
              <span className="text-sm font-bold text-muted-foreground">
                {track.chart_position || index + 1}
              </span>
            </div>

            {/* Album Art */}
            <div className="relative h-10 w-10 rounded overflow-hidden bg-muted">
              <img
                src={getCoverArtUrl(track.cover_art_path)}
                alt={track.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
            </div>

            {/* Play Count */}
            {(track.play_count || 0) >= 1000 && (
              <div className="text-xs text-muted-foreground">
                {formatPlayCount(track.play_count)} plays
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          {totalTracks} tracks total
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs hover:text-primary"
          onClick={onViewAll}
        >
          View all tracks
        </Button>
      </div>
    </div>
  );
};