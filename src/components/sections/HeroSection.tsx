import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Heart, TrendingUp, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTracks } from "@/hooks/use-tracks";
import { useMusicPlayer } from "@/contexts/music-player";

// Hero section with featured banner
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
    <section className="relative h-[320px] sm:h-[400px] md:h-[480px] overflow-hidden rounded-2xl">
      {/* Background Images with transition */}
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
          />
        </div>
      ))}
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center p-4 sm:p-8 md:p-12">
        <div className="max-w-xl space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
              <TrendingUp className="h-3 w-3" />
              Featured
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-secondary/20 text-secondary border border-secondary/30">
              <Music className="h-3 w-3" />
              New Release
            </span>
          </div>
          
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-2 sm:mb-3">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-pulse-light">
                MAUDIO
              </span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-md">
              Discover trending sounds that move with your mood. Stream millions of tracks from artists worldwide.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              size="lg" 
              onClick={handlePlay}
              className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              <Play className="h-5 w-5" />
              {isCurrentTrack && isPlaying ? "Now Playing" : "Start Listening"}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/70"
              asChild
            >
              <Link to="/browse">
                <Heart className="h-5 w-5" />
                Explore Music
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 sm:gap-8 pt-2 sm:pt-4">
            <div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">10K+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Active Artists</p>
            </div>
            <div className="w-px h-8 sm:h-10 bg-border/50" />
            <div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">50K+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Tracks</p>
            </div>
            <div className="w-px h-8 sm:h-10 bg-border/50" />
            <div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">1M+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Streams</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/2 right-12 -translate-y-1/2 hidden lg:block">
        <div className="relative">
          <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl animate-pulse-light" />
        </div>
      </div>
    </section>
  );
}