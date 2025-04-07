
import { useState } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Heart, MoreHorizontal, Maximize2
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import AdUnit from "@/components/ads/AdUnit";

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(217); // 3:37 in seconds
  const [showAd, setShowAd] = useState(true); // In a real app, this might depend on user subscription status
  
  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  
  // Format time in mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-maudio-darker border-t border-border p-3 z-40">
      {showAd && (
        <div className="flex justify-center mb-2 max-h-[60px]">
          <AdUnit size="banner" />
        </div>
      )}
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
        {/* Track Info */}
        <div className="flex items-center space-x-3 w-full md:w-1/4">
          <div className="h-12 w-12 bg-muted rounded-md overflow-hidden">
            <img 
              src="https://picsum.photos/id/65/200/200" 
              alt="Album cover" 
              className="h-full w-full object-cover"
            />
          </div>
          <div className="truncate">
            <h4 className="text-sm font-medium truncate">Starlight Dreams</h4>
            <p className="text-xs text-muted-foreground truncate">Night Visions</p>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Player Controls */}
        <div className="flex flex-col space-y-2 w-full md:w-2/4">
          <div className="flex items-center justify-center space-x-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button 
              onClick={togglePlay}
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-white"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <SkipForward className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Repeat className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              className="flex-1"
              onValueChange={(value) => setCurrentTime(value[0])}
            />
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Volume & Expand */}
        <div className="flex items-center space-x-3 w-full md:w-1/4 justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-primary"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            className="w-20"
            onValueChange={(value) => {
              setVolume(value[0]);
              setIsMuted(value[0] === 0);
            }}
          />
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hidden md:flex">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
