/**
 * Network status helper. Uses @capacitor/network on native, navigator.onLine on web.
 */
import { Capacitor } from "@capacitor/core";

const isNative = (): boolean => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

export async function isOnline(): Promise<boolean> {
  if (isNative()) {
    try {
      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();
      return status.connected;
    } catch { return navigator.onLine; }
  }
  return navigator.onLine;
}

export async function onNetworkChange(cb: (online: boolean) => void): Promise<() => void> {
  if (isNative()) {
    try {
      const { Network } = await import("@capacitor/network");
      const handle = await Network.addListener("networkStatusChange", (s) => cb(s.connected));
      return () => handle.remove();
    } catch {/* fall through */}
  }
  const on = () => cb(true);
  const off = () => cb(false);
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
}