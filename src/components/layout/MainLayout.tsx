
import React, { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MusicPlayer from "./MusicPlayer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCapacitor } from "@/hooks/use-capacitor";

interface MainLayoutProps {
  children: ReactNode;
  hidePlayer?: boolean;
}

const MainLayout = ({ 
  children, 
  hidePlayer = false
}: MainLayoutProps) => {
  const isMobile = useIsMobile();
  const { isNative } = useCapacitor();
  
  return (
    <div className={`flex flex-col min-h-screen ${isNative ? 'pt-safe' : ''}`}>
      <Navbar />
      
      <div className="flex flex-1">
        {/* Main content */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
      
      {/* Add extra padding at the bottom on mobile to account for the music player */}
      {!hidePlayer && <div className={isMobile ? "h-16" : "h-24"} />}
      {!hidePlayer && <MusicPlayer />}
      <Footer />
    </div>
  );
};

export default MainLayout;
