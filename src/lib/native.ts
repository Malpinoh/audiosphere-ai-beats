/**
 * Native bridge — Capacitor-only features with safe web fallbacks.
 *
 * Hybrid strategy:
 *  - When running inside Capacitor (Android/iOS), use native plugins
 *    (LocalNotifications permission, Haptics, App lifecycle, dynamic
 *    shortcuts via the App plugin).
 *  - When running in a browser, every export becomes a no-op so existing
 *    web behaviour (MediaSession API, navigator.vibrate, etc.) keeps
 *    working untouched.
 */
import { Capacitor } from "@capacitor/core";

export const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const getPlatform = (): "ios" | "android" | "web" => {
  try {
    return Capacitor.getPlatform() as "ios" | "android" | "web";
  } catch {
    return "web";
  }
};

/** Trigger a light haptic (native) or a short vibration (web). */
export async function hapticLight(): Promise<void> {
  if (isNative()) {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    } catch (e) {
      // fall through to web fallback
    }
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(10); } catch {}
  }
}

export async function hapticMedium(): Promise<void> {
  if (isNative()) {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Medium });
      return;
    } catch {}
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(20); } catch {}
  }
}

/**
 * Request notification permission (Android 13+ requires runtime grant).
 * We do NOT register for push — only ask permission so the OS prompt
 * fires once and we know the future state. Returns granted boolean.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return true;
    if (status.display === "denied") return false;
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  } catch (e) {
    console.warn("[native] notification permission check failed", e);
    return false;
  }
}

export async function getNotificationPermission(): Promise<"granted" | "denied" | "prompt" | "unknown"> {
  if (!isNative()) return "unknown";
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return "granted";
    if (status.display === "denied") return "denied";
    return "prompt";
  } catch {
    return "unknown";
  }
}

/**
 * Dynamic home-screen shortcuts. The official Capacitor core has no
 * built-in shortcuts API; we expose a stable interface here so we can
 * later swap in `@capacitor-community/app-shortcuts` (or a custom
 * Android plugin) without changing call sites.
 *
 * For now this is a no-op on web and logs intent on native. The
 * hybrid plan documented for the user is to add the shortcuts plugin
 * via `npx cap add` and then this function will route through it.
 */
export interface HomeShortcut {
  id: string;
  title: string;
  url: string; // deep-link path inside the SPA, e.g. "/library"
}

export async function setHomeShortcuts(shortcuts: HomeShortcut[]): Promise<void> {
  if (!isNative()) return;
  try {
    // Lazy probe: if a shortcuts plugin is registered with Capacitor,
    // forward to it. Otherwise stash the intent for the next launch.
    const cap = (await import("@capacitor/core")).Capacitor as any;
    if (cap?.Plugins?.AppShortcuts?.set) {
      await cap.Plugins.AppShortcuts.set({ shortcuts });
      return;
    }
    if (typeof window !== "undefined") {
      try { localStorage.setItem("pending_home_shortcuts", JSON.stringify(shortcuts)); } catch {}
    }
  } catch (e) {
    console.warn("[native] setHomeShortcuts failed", e);
  }
}

/** Subscribe to native app lifecycle. Returns an unsubscribe fn. */
export async function onAppStateChange(
  cb: (active: boolean) => void
): Promise<() => void> {
  if (!isNative()) {
    const handler = () => cb(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }
  try {
    const { App } = await import("@capacitor/app");
    const sub = await App.addListener("appStateChange", ({ isActive }) => cb(isActive));
    return () => sub.remove();
  } catch {
    return () => {};
  }
}