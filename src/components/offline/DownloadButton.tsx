import { useEffect, useState } from "react";
import { Download, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Track } from "@/types/track-types";
import { downloadTrack, deleteDownload, isDownloaded } from "@/lib/offline/storage";
import { hapticLight } from "@/lib/native";

interface Props {
  track: Track;
  size?: "sm" | "md";
  className?: string;
  /** When true, render only an icon (for tight UIs like row actions). */
  iconOnly?: boolean;
}

/**
 * Download / delete-download toggle for a single track.
 * Works on web (records intent) + native (writes to Documents/music_downloads).
 */
export function DownloadButton({ track, size = "sm", className, iconOnly }: Props) {
  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    isDownloaded(track.id).then((v) => { if (active) setDownloaded(v); }).catch(() => {});
    return () => { active = false; };
  }, [track.id]);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (busy) return;
    setBusy(true);
    hapticLight();
    try {
      if (downloaded) {
        await deleteDownload(track.id);
        setDownloaded(false);
        toast.success("Removed from downloads", { duration: 2500 });
      } else {
        toast.loading(`Downloading "${track.title}"…`, { id: `dl-${track.id}`, duration: 30000 });
        await downloadTrack({
          id: track.id, title: track.title, artist: track.artist,
          album_name: track.album_name, cover_art_path: track.cover_art_path,
          audio_file_path: track.audio_file_path, duration: track.duration,
        });
        setDownloaded(true);
        toast.success("Downloaded — available offline", { id: `dl-${track.id}`, duration: 2500 });
      }
    } catch (err: any) {
      toast.error(err?.message || "Download failed", { id: `dl-${track.id}`, duration: 2500 });
    } finally {
      setBusy(false);
    }
  };

  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onClick}
      disabled={busy}
      aria-label={downloaded ? "Delete download" : "Download for offline"}
      className={cn(
        size === "md" ? "h-9 w-9" : "h-8 w-8",
        "text-muted-foreground hover:text-foreground",
        downloaded && "text-primary hover:text-primary",
        className,
      )}
    >
      {busy ? (
        <Loader2 className={cn(iconSize, "animate-spin")} />
      ) : downloaded ? (
        iconOnly ? <Check className={iconSize} /> : <Check className={iconSize} />
      ) : (
        <Download className={iconSize} />
      )}
    </Button>
  );
}

/** Small inline trash version used in the Downloads list. */
export function DeleteDownloadButton({ trackId, onDeleted }: { trackId: string; onDeleted?: () => void }) {
  const [busy, setBusy] = useState(false);
  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setBusy(true);
    try {
      await deleteDownload(trackId);
      toast.success("Removed from downloads", { duration: 2500 });
      onDeleted?.();
    } catch {
      toast.error("Could not remove download", { duration: 2500 });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button type="button" size="icon" variant="ghost" onClick={onClick} disabled={busy}
      className="h-8 w-8 text-muted-foreground hover:text-destructive">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}