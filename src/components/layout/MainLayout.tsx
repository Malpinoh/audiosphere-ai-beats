
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MusicPlayer from "./MusicPlayer";

interface MainLayoutProps {
  children: ReactNode;
  hidePlayer?: boolean;
}

const MainLayout = ({ children, hidePlayer = false }: MainLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pb-24">
        {children}
      </main>
      {!hidePlayer && <MusicPlayer />}
      <Footer />
    </div>
  );
};

export default MainLayout;
