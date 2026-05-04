/**
 * Native lock-screen / notification media controls.
 *
 * Uses `capacitor-music-controls-plugin` on Android (foreground service +
 * notification + lock-screen). On web / iOS we no-op and let the existing
 * navigator.mediaSession code in useMusicPlayerState handle controls.
 *
 * Action events arrive on the global `controlsNotification` window event.
 */
import { Capacitor } from "@capacitor/core";

const isAndroidNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch { return false; }
};

let _plugin: any | null = null;
let _listenersAttached = false;

async function getPlugin(): Promise<any | null> {
  if (!isAndroidNative()) return null;
  if (_plugin) return _plugin;
  try {
    const mod: any = await import("capacitor-music-controls-plugin");
    _plugin = mod.CapacitorMusicControls || mod.default || null;
    return _plugin;
  } catch (e) {
    console.warn("[musicControls] plugin not available", e);
    return null;
  }
}

export interface MediaInfo {
  track: string;
  artist: string;
  album?: string;
  cover?: string;
  duration?: number;
  elapsed?: number;
  isPlaying: boolean;
}

/** Show or update the persistent media notification + lock-screen controls. */
export async function showMediaControls(info: MediaInfo): Promise<void> {
  const p = await getPlugin();
  if (!p) return;
  try {
    await p.create({
      track: info.track,
      artist: info.artist,
      album: info.album || "",
      cover: info.cover || "",
      isPlaying: info.isPlaying,
      dismissable: false,
      hasPrev: true,
      hasNext: true,
      hasClose: true,
      duration: info.duration || 0,
      elapsed: info.elapsed || 0,
      hasScrubbing: true,
      ticker: `Now playing: ${info.track}`,
      playIcon: "media_play",
      pauseIcon: "media_pause",
      prevIcon: "media_prev",
      nextIcon: "media_next",
      closeIcon: "media_close",
      notificationIcon: "notification",
    });
  } catch (e) {
    console.warn("[musicControls] create failed", e);
  }
}

export async function updatePlaybackState(isPlaying: boolean, elapsed?: number): Promise<void> {
  const p = await getPlugin();
  if (!p) return;
  try {
    await p.updateIsPlaying({ isPlaying });
    if (typeof elapsed === "number") {
      await p.updateElapsed?.({ elapsed, isPlaying });
    }
  } catch {}
}

export async function destroyMediaControls(): Promise<void> {
  const p = await getPlugin();
  if (!p) return;
  try { await p.destroy(); } catch {}
}

export type MediaControlAction =
  | "music-controls-play" | "music-controls-pause" | "music-controls-toggle-play-pause"
  | "music-controls-next" | "music-controls-previous"
  | "music-controls-destroy" | "music-controls-seek-to"
  | "music-controls-headset-unplugged" | "music-controls-headset-plugged"
  | "music-controls-media-button-play" | "music-controls-media-button-pause"
  | "music-controls-media-button-next" | "music-controls-media-button-previous";

export interface MediaControlEvent { message: MediaControlAction; position?: number; }

export async function attachControlsListener(cb: (e: MediaControlEvent) => void): Promise<() => void> {
  const p = await getPlugin();
  if (!p) return () => {};
  if (_listenersAttached) {/* allow rebind */}
  const handler = (action: any) => {
    try {
      const data = typeof action === "string" ? JSON.parse(action) : action;
      cb(data);
    } catch { cb({ message: action?.message }); }
  };
  // The plugin emits via a global document event AND as a Capacitor listener
  // depending on version. Wire both safely.
  let cleanup = () => {};
  try {
    if (typeof p.addListener === "function") {
      const sub = await p.addListener("controlsNotification", handler);
      cleanup = () => { try { sub.remove(); } catch {} };
    }
  } catch {}
  const docHandler = (ev: any) => handler(ev?.detail ?? ev?.message ?? ev);
  document.addEventListener("controlsNotification", docHandler as any);
  _listenersAttached = true;
  return () => {
    cleanup();
    document.removeEventListener("controlsNotification", docHandler as any);
    _listenersAttached = false;
  };
}