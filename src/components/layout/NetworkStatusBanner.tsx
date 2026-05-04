import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { onNetworkChange, isOnline } from "@/lib/offline/network";
import { listOfflineMix } from "@/lib/offline/storage";

export function NetworkStatusBanner() {
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let detach = () => {};
    isOnline().then(setOnline).catch(() => {});
    onNetworkChange(async (isOn) => {
      if (isOn) {
        setOnline(true);
        setShowBackOnline(true);
        toast.success("Back online", { duration: 2500 });
        setTimeout(() => setShowBackOnline(false), 2500);
      } else {
        setOnline(false);
        const mix = await listOfflineMix().catch(() => []);
        if (mix.length > 0) {
          toast.error("You're offline — playing from your Offline Mix", {
            duration: 4000,
            action: { label: "Open", onClick: () => navigate("/library") },
          });
        } else {
          toast.error("No internet connection", { duration: 3000 });
        }
      }
    }).then((d) => { detach = d; });
    return () => { detach(); };
  }, []);

  if (online && !showBackOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-0 inset-x-0 z-[60] px-4 py-2 text-center text-sm font-medium shadow-lg",
        online
          ? "bg-emerald-600 text-white"
          : "bg-destructive text-destructive-foreground"
      )}
    >
      <span className="inline-flex items-center gap-2 justify-center">
        {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        {online ? "Back online" : "No internet connection"}
      </span>
    </div>
  );
}
