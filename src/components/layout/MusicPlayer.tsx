
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Heart, MoreHorizontal, Maximize2, ListMusic
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdUnit from "@/components/ads/AdUnit";
import { Link } from "react-router-dom";

const MusicPlayer = () => {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    isMuted,
    isLoading,
    queue,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    playTrack,
    removeFromQueue
  } = useMusicPlayer();
  
  const [showAd, setShowAd] = useState(true);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Format time in mm:ss
  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const toggleLike = () => {
    setIsLiked(!isLiked);
  };
  
  // Skip 15% of track when clicking on previous/next, unless we're near start/end
  const handleSkipBackward = () => {
    if (currentTime < 5) {
      playPrevious();
    } else {
      seekTo(0);
    }
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
          {currentTrack ? (
            <>
              <Link 
                to={`/track/${currentTrack.id}`}
                className="h-12 w-12 bg-muted rounded-md overflow-hidden"
              >
                <img 
                  src={currentTrack.cover || currentTrack.cover_art_path} 
                  alt="Album cover" 
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="truncate">
                <Link to={`/track/${currentTrack.id}`} className="text-sm font-medium truncate hover:text-primary">
                  {currentTrack.title}
                </Link>
                <Link to={`/artist/${currentTrack.id}`} className="text-xs text-muted-foreground truncate hover:text-primary block">
                  {currentTrack.artist}
                </Link>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-primary"
                onClick={toggleLike}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-secondary text-secondary' : ''}`} />
              </Button>
            </>
          ) : (
            <div className="flex items-center text-muted-foreground text-sm italic">
              No track selected
            </div>
          )}
        </div>
        
        {/* Player Controls */}
        <div className="flex flex-col space-y-2 w-full md:w-2/4">
          <div className="flex items-center justify-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`text-muted-foreground hover:text-primary ${shuffle ? 'text-primary' : ''}`}
              onClick={() => setShuffle(!shuffle)}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-primary"
              onClick={handleSkipBackward}
              disabled={!currentTrack}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button 
              onClick={togglePlay}
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-white"
              disabled={!currentTrack}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" /> 
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-primary"
              onClick={playNext}
              disabled={!currentTrack || queue.length === 0}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`text-muted-foreground hover:text-primary ${repeat ? 'text-primary' : ''}`}
              onClick={() => setRepeat(!repeat)}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 1}
              step={1}
              className="flex-1"
              onValueChange={(value) => seekTo(value[0])}
              disabled={!currentTrack}
            />
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Volume & Expand */}
        <div className="flex items-center space-x-3 w-full md:w-1/4 justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <ListMusic className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-2">Queue</h3>
                <Separator className="mb-4" />
                <ScrollArea className="flex-1">
                  {queue.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Your queue is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {queue.map((track) => (
                        <div 
                          key={track.id}
                          className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 ${
                            currentTrack?.id === track.id ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden">
                            <img 
                              src={track.cover || track.cover_art_path} 
                              alt={track.title} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{track.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 flex-shrink-0" 
                            onClick={() => playTrack(track)}
                          >
                            {currentTrack?.id === track.id && isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 flex-shrink-0 text-muted-foreground" 
                            onClick={() => removeFromQueue(track.id)}
                          >
                            <span className="sr-only">Remove</span>
                            <span aria-hidden>×</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
          
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
