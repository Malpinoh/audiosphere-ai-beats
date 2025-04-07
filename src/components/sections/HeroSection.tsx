
import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

// Hero section with featured banner
export function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const togglePlay = () => setIsPlaying(!isPlaying);
  
  return (
    <section className="relative h-[450px] md:h-[500px] overflow-hidden bg-maudio-darker">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-40">
        <img 
          src="https://picsum.photos/id/1047/1920/1080" 
          alt="Featured artist"
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-maudio-dark via-transparent to-transparent"></div>
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1 mb-4 text-xs font-semibold rounded-full bg-primary/20 text-primary">
            Featured
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">MAUDIO</h1>
          <p className="text-xl md:text-2xl mb-6 text-white/80">
            Listen to new trending sounds that will move with your mood
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={togglePlay}
              className="gap-2 maudio-gradient-bg"
            >
              <Play className="h-5 w-5" />
              {isPlaying ? "Pause Latest Track" : "Play Latest Track"}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2 border-white/20 text-white hover:bg-white/10"
              asChild
            >
              <Link to="/browse">
                <Heart className="h-5 w-5" />
                Explore Music
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
