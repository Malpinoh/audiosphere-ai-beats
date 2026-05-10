import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, WifiOff, Download as DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackCard } from "@/components/ui/track-card";
import { listDownloads, listOfflineMix, offlineToTrack, OfflineTrack } from "@/lib/offline/storage";
import { useMusicPlayer } from "@/contexts/music-player";
import { Track } from "@/types/track-types";
import { hapticLight } from "@/lib/native";

/**
 * Home screen content shown when the device is offline.
 * Surfaces the user's Offline Mix and downloaded tracks so they can keep
 * playing without a network connection.
 */
export function OfflineHomeSection() {
  const [downloads, setDownloads] = useState<OfflineTrack[]>([]);
  const [mix, setMix] = useState<OfflineTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const { setQueue, playTrack } = useMusicPlayer();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [d, m] = await Promise.all([listDownloads(), listOfflineMix()]);
        if (!active) return;
        setDownloads(d); setMix(m);
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const playMix = () => {
    if (mix.length === 0) return;
    hapticLight();
    const tracks = mix.map(offlineToTrack) as Track[];
    setQueue(tracks, { kind: "playlist", name: "Offline Mix" });
    playTrack(tracks[0]);
  };

  return (
    <section className="space-y-8 pb-8">
      <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border px-4 py-3">
        <WifiOff className="h-5 w-5 text-destructive" />
        <div className="flex-1">
          <h2 className="text-sm font-semibold">You're offline</h2>
          <p className="text-xs text-muted-foreground">Showing music you can play without a connection.</p>
        </div>
        {mix.length > 0 && (
          <Button size="sm" onClick={playMix} className="gap-1.5">
            <Play className="h-4 w-4" /> Play Mix
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <h3 className="text-xl font-bold">Offline Mix</h3>
          <Link to="/library" className="text-xs text-muted-foreground hover:text-foreground">See all</Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : mix.length === 0 ? (
          <p className="text-sm text-muted-foreground">No offline tracks yet. Download songs to listen offline.</p>
        ) : (
          <div className="space-y-0.5">
            {mix.slice(0, 10).map((o) => (
              <TrackCard key={o.track_id} track={offlineToTrack(o) as Track} variant="list" />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <DownloadIcon className="h-5 w-5" /> Downloads
          </h3>
          <Link to="/library" className="text-xs text-muted-foreground hover:text-foreground">See all</Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : downloads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No downloads yet. Tap the download icon on any track to save it for offline.</p>
        ) : (
          <div className="space-y-0.5">
            {downloads.slice(0, 10).map((o) => (
              <TrackCard key={o.track_id} track={offlineToTrack(o) as Track} variant="list" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}