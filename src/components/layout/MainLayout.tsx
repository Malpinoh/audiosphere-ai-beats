
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MusicPlayer from "./MusicPlayer";
import AdUnit from "@/components/ads/AdUnit";

interface MainLayoutProps {
  children: ReactNode;
  hidePlayer?: boolean;
  showSidebarAds?: boolean;
  showTopAd?: boolean;
}

const MainLayout = ({ 
  children, 
  hidePlayer = false,
  showSidebarAds = false,
  showTopAd = false
}: MainLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {showTopAd && (
        <div className="w-full py-2 flex justify-center border-b border-border">
          <AdUnit size="leaderboard" />
        </div>
      )}
      
      <div className="flex flex-1">
        {/* Main content */}
        <main className={`flex-1 pb-24 ${showSidebarAds ? 'max-w-[calc(100%-180px)]' : 'w-full'}`}>
          {children}
        </main>
        
        {/* Sidebar ad */}
        {showSidebarAds && (
          <aside className="hidden lg:block w-[180px] p-4 border-l border-border">
            <div className="sticky top-20">
              <AdUnit size="skyscraper" className="mx-auto" />
            </div>
          </aside>
        )}
      </div>
      
      {!hidePlayer && <MusicPlayer />}
      <Footer />
    </div>
  );
};

export default MainLayout;
