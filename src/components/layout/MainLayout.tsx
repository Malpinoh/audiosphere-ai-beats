import React, { ReactNode } from "react";
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
}

const MainLayout = ({ 
  children, 
  hidePlayer = false
}: MainLayoutProps) => {
  const isMobile = useIsMobile();
  const { currentTrack } = useMusicPlayer();

  // Mobile: bottom nav (56px) + mini player when track active (~58px)
  const hasMiniPlayer = isMobile && !hidePlayer && !!currentTrack;
  const bottomSpacing = isMobile
    ? hasMiniPlayer ? 'h-[116px]' : 'h-14'
    : hidePlayer ? 'h-0' : 'h-24';
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NetworkStatusBanner />
      <Navbar />
      
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
      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default MainLayout;
