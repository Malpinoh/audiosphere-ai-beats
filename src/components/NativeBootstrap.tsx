import { useEffect, useRef } from "react";
import {
  isNative,
  getPlatform,
  requestNotificationPermission,
  setHomeShortcuts,
  onAppStateChange,
} from "@/lib/native";
import { useMusicPlayer } from "@/contexts/music-player";

/**
 * Mounts once at the App root. Owns all native-only side effects:
 *  - asks Android 13+ notification permission after the first user gesture
 *  - registers/refreshes dynamic home-screen shortcuts
 *  - updates MediaSession playback state on app foreground/background
 *
 * No-op outside of Capacitor.
 */
export function NativeBootstrap() {
  const { currentTrack, isPlaying } = useMusicPlayer();
  const askedRef = useRef(false);

  // Notification permission — request after first interaction (Android 13+).
  useEffect(() => {
    if (!isNative() || getPlatform() !== "android") return;
    if (askedRef.current) return;
    const trigger = async () => {
      if (askedRef.current) return;
      askedRef.current = true;
      try {
        await requestNotificationPermission();
      } catch {}
      window.removeEventListener("pointerdown", trigger);
      window.removeEventListener("touchstart", trigger);
    };
    window.addEventListener("pointerdown", trigger, { once: false, passive: true });
    window.addEventListener("touchstart", trigger, { once: false, passive: true });
    return () => {
      window.removeEventListener("pointerdown", trigger);
      window.removeEventListener("touchstart", trigger);
    };
  }, []);

  // Persist last-played track id for the "Play Last Song" shortcut.
  useEffect(() => {
    if (!currentTrack) return;
    try {
      localStorage.setItem(
        "last_played_track",
        JSON.stringify({ id: currentTrack.id, title: currentTrack.title, artist: currentTrack.artist })
      );
    } catch {}
  }, [currentTrack?.id]);

  // Refresh dynamic shortcuts whenever the last-played track changes.
  useEffect(() => {
    if (!isNative()) return;
    let last: { id: string; title?: string } | null = null;
    try {
      const raw = localStorage.getItem("last_played_track");
      if (raw) last = JSON.parse(raw);
    } catch {}
    setHomeShortcuts([
      ...(last
        ? [{
            id: "play-last",
            title: `Play: ${(last.title || "Last song").slice(0, 28)}`,
            url: `/track/${last.id}?autoplay=1`,
          }]
        : []),
      { id: "open-library", title: "Open Library", url: "/library" },
      { id: "search-music", title: "Search Music", url: "/browse" },
    ]);
  }, [currentTrack?.id]);

  // Keep MediaSession in sync with app lifecycle so lock-screen art stays
  // accurate after backgrounding the app.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    onAppStateChange((active) => {
      if (!active) return;
      if ("mediaSession" in navigator) {
        try {
          (navigator.mediaSession as any).playbackState = isPlaying ? "playing" : "paused";
        } catch {}
      }
    }).then((u) => { unsub = u; });
    return () => { try { unsub?.(); } catch {} };
  }, [isPlaying]);

  return null;
}