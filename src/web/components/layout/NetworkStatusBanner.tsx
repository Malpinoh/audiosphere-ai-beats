import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { onNetworkChange, isOnline } from "@mobile";

export function NetworkStatusBanner() {
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    let detach = () => {};
    isOnline().then((on) => {
      setOnline(on);
      if (!on) { setShowOffline(true); setTimeout(() => setShowOffline(false), 2000); }
    }).catch(() => {});
    onNetworkChange((isOn) => {
      if (isOn) {
        setOnline(true);
        setShowBackOnline(true);
        setTimeout(() => setShowBackOnline(false), 2000);
      } else {
        setOnline(false);
        setShowOffline(true);
        setTimeout(() => setShowOffline(false), 2000);
      }
    }).then((d) => { detach = d; });
    return () => { detach(); };
  }, []);

  const visible = (online && showBackOnline) || (!online && showOffline);
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-[60] h-9 w-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 animate-fade-in",
        "bottom-[calc(env(safe-area-inset-bottom)+140px)] md:bottom-[calc(env(safe-area-inset-bottom)+104px)]",
        online
          ? "bg-emerald-600 text-overlay-foreground"
          : "bg-destructive text-destructive-foreground"
      )}
      aria-label={online ? "Back online" : "Offline"}
    >
      {online ? <Wifi className="h-4 w-4 animate-pulse" /> : <WifiOff className="h-4 w-4 animate-pulse" />}
    </div>
  );
}
