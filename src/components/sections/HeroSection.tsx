import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Heart, TrendingUp, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTracks } from "@/hooks/use-tracks";
import { useMusicPlayer } from "@/contexts/music-player";

export function HeroSection() {
  const { tracks } = useTracks({ limit: 1 });
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer();
  const [currentBg, setCurrentBg] = useState(0);
  
  const featuredTrack = tracks[0];
  const isCurrentTrack = currentTrack?.id === featuredTrack?.id;

  const backgrounds = [
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&h=1080&fit=crop",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1920&h=1080&fit=crop",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&h=1080&fit=crop",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  
  const handlePlay = () => {
    if (featuredTrack) {
      if (isCurrentTrack) {
        togglePlay();
      } else {
        playTrack(featuredTrack);
      }
    }
  };
  
  return (
    <section className="relative h-[240px] sm:h-[360px] md:h-[440px] overflow-hidden rounded-2xl">
      {/* Background Images */}
      {backgrounds.map((bg, index) => (
        <div
          key={bg}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentBg ? "opacity-100" : "opacity-0"
          }`}
        >
          <img 
            src={bg}
            alt="Featured background"
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center p-4 sm:p-8 md:p-12">
        <div className="max-w-lg space-y-3 sm:space-y-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
              <TrendingUp className="h-3 w-3" />
              Featured
            </span>
          </div>
          
          <div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-1 sm:mb-2">
              <span className="maudio-gradient-text">
                Discover New Music
              </span>
            </h1>
            <p className="text-xs sm:text-base md:text-lg text-muted-foreground max-w-sm">
              Stream and discover tracks from independent artists worldwide.
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              size="sm"
              onClick={handlePlay}
              className="gap-1.5 sm:gap-2 maudio-gradient-bg hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 text-xs sm:text-sm"
            >
              <Play className="h-4 w-4" />
              {isCurrentTrack && isPlaying ? "Now Playing" : "Start Listening"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1.5 sm:gap-2 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/70 text-xs sm:text-sm"
              asChild
            >
              <Link to="/browse">
                Explore
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
