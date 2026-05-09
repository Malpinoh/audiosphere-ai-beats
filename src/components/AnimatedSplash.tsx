import { useEffect, useState } from "react";
import logo from "@/assets/maudio-logo.svg";
import { isNative } from "@/lib/native";

/**
 * Animated brand splash overlay shown on app launch.
 * - Hides the native Capacitor splash early so this React-rendered splash
 *   takes over and animates the MAUDIO logo + waveform.
 * - Auto-dismisses after ~1800ms with a fade-out.
 */
export function AnimatedSplash() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Hide native (static) splash immediately so ours is the only one.
    if (isNative()) {
      import("@capacitor/splash-screen")
        .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 200 }))
        .catch(() => {});
    }
    const fadeT = setTimeout(() => setFading(true), 1500);
    const hideT = setTimeout(() => setVisible(false), 1900);
    return () => { clearTimeout(fadeT); clearTimeout(hideT); };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#121212] transition-opacity duration-400 ${fading ? "opacity-0" : "opacity-100"}`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Pulsing glow behind logo */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-40 w-40 rounded-full bg-[#7c3aed]/30 blur-3xl animate-ping" />
        <div
          className="relative text-white"
          style={{ animation: "splashPop 700ms cubic-bezier(.2,.9,.3,1.2) both" }}
        >
          <img src={logo} alt="MAUDIO" className="h-16 w-auto drop-shadow-[0_0_20px_rgba(124,58,237,0.6)]" />
        </div>
      </div>

      {/* Animated waveform bars */}
      <div className="mt-8 flex items-end gap-1.5 h-8" aria-hidden>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-[#7c3aed] to-[#a855f7]"
            style={{
              animation: `splashBar 900ms ${i * 90}ms ease-in-out infinite alternate`,
              height: "30%",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splashPop {
          0%   { transform: scale(.6); opacity: 0; filter: blur(8px); }
          60%  { transform: scale(1.08); opacity: 1; filter: blur(0); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes splashBar {
          0%   { height: 18%; opacity: .55; }
          100% { height: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}