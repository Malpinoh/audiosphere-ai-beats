
import React, { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MusicPlayer from "./MusicPlayer";
import MobileBottomNav from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  hidePlayer?: boolean;
}

const MainLayout = ({ 
  children, 
  hidePlayer = false
}: MainLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1 w-full">
        {children}
      </main>
      
      {/* Spacer for fixed music player */}
      {!hidePlayer && (
        <div className={`${isMobile ? "h-[120px]" : "h-24"} flex-shrink-0`} />
      )}
      {!hidePlayer && <MusicPlayer />}
      
      {/* Bottom nav spacing on mobile */}
      {isMobile && !hidePlayer && <div className="h-14 flex-shrink-0" />}
      
      {/* Footer hidden on mobile - bottom nav replaces it */}
      {!isMobile && <Footer />}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default MainLayout;
