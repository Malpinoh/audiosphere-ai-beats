
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MusicPlayer from "./MusicPlayer";
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex flex-1">
        {/* Main content */}
        <main className="flex-1 pb-24 w-full">
          {children}
        </main>
      </div>
      
      {!hidePlayer && <MusicPlayer />}
      <Footer />
    </div>
  );
};

export default MainLayout;
