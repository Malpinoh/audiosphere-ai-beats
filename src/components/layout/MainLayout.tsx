import React, { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MusicPlayer from "./MusicPlayer";
import MobileMiniPlayer from "./MobileMiniPlayer";
import MobileBottomNav from "./MobileBottomNav";
import { NetworkStatusBanner } from "./NetworkStatusBanner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMusicPlayer } from "@/contexts/music-player";

interface MainLayoutProps {
  children: ReactNode;
  hidePlayer?: boolean;
  /** Hide the global Navbar on mobile (used by Home which has its own header). */
  hideMobileNavbar?: boolean;
}

const MainLayout = ({ 
  children, 
  hidePlayer = false,
  hideMobileNavbar = false,
}: MainLayoutProps) => {
  const isMobile = useIsMobile();
  const { currentTrack } = useMusicPlayer();
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Listen to the global fullscreen-player-change event so we can hide
  // the bottom nav + mini player while the immersive player is open.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { open?: boolean } | undefined;
      setFullscreenOpen(!!detail?.open);
    };
    window.addEventListener('fullscreen-player-change', handler);
    // Sync initial state from data-attribute (covers SSR/late mount cases)
    if (typeof document !== 'undefined' && document.body.dataset.fullscreenPlayer === 'open') {
      setFullscreenOpen(true);
    }
    return () => window.removeEventListener('fullscreen-player-change', handler);
  }, []);

  // Mobile: bottom nav (56px) + safe-inset + floating mini player (~62px + 8px gap)
  const hasMiniPlayer = isMobile && !hidePlayer && !!currentTrack;
  const showBottomNav = isMobile && !fullscreenOpen;
  const bottomSpacing = isMobile
    ? fullscreenOpen
      ? 'h-0'
      : hasMiniPlayer
        ? 'h-[136px]' // 56 nav + 8 gap + 62 card + ~10 inset
        : 'h-14'
    : hidePlayer ? 'h-0' : 'h-24';

  const showNavbar = !(isMobile && hideMobileNavbar);
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NetworkStatusBanner />
      {showNavbar && <Navbar />}
      
      <main className="flex-1 w-full">
        {children}
      </main>
      
      <div className={`${bottomSpacing} flex-shrink-0`} />
      
      {/* Desktop player */}
      {!hidePlayer && <MusicPlayer />}
      
      {/* Mobile mini player — only when a track is active */}
      {hasMiniPlayer && <MobileMiniPlayer />}
      
      {/* Footer hidden on mobile - bottom nav replaces it */}
      {!isMobile && <Footer />}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
};

export default MainLayout;
