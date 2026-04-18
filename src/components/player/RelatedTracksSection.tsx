import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMusicPlayer } from "@/contexts/music-player";
import { Track } from "@/types/track-types";
import { Play } from "lucide-react";

interface Props {
  trackId: string;
}

interface SimilarTrackRow {
  track_id: string;
  title: string;
  artist: string;
  cover_art_path: string;
  genre: string;
  mood: string;
  play_count: number;
}

export function RelatedTracksSection({ trackId }: Props) {
  const [tracks, setTracks] = useState<SimilarTrackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .rpc("get_similar_tracks", { p_track_id: trackId, p_limit: 5 })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setTracks(data as any);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trackId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Related Tracks</h3>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Related Tracks</h3>
      <div className="space-y-1.5">
        {tracks.map((t) => {
          const cover = t.cover_art_path
            ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${t.cover_art_path}`
            : "/placeholder.svg";
          return (
            <button
              key={t.track_id}
              onClick={() =>
                playTrack({
                  id: t.track_id,
                  title: t.title,
                  artist: t.artist,
                  cover_art_path: t.cover_art_path,
                  audio_file_path: "", // resolved by player; will be loaded via track service if needed
                  genre: t.genre,
                  mood: t.mood,
                  play_count: t.play_count,
                  like_count: 0,
                  tags: [],
                  published: true,
                  user_id: "",
                } as Track)
              }
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left"
            >
              <img src={cover} alt={t.title} className="h-12 w-12 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
              </div>
              <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
