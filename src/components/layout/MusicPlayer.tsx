import { useMusicPlayer } from "@/contexts/music-player";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Shuffle, Heart, MoreHorizontal, Maximize2, ListMusic,
  MessageSquare
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileFullscreenPlayer } from "./MobileFullscreenPlayer";
import { useTrackComments } from "@/hooks/use-track-comments";
import { FloatingComments } from "@/components/player/FloatingComments";
import { CommentsSection } from "@/components/player/CommentsSection";

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
    removeFromQueue,
    likeTrack,
    unlikeTrack,
    isTrackLiked
  } = useMusicPlayer();
  
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  
  const isMobile = useIsMobile();
  
  // Add comments functionality
  const { comments, loading: commentsLoading, addComment, getTopComments } = useTrackComments(currentTrack?.id || null);
  const topComments = getTopComments();

  // Format time in mm:ss
  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleLikeToggle = () => {
    if (!currentTrack) return;
    
    if (isTrackLiked(currentTrack.id)) {
      unlikeTrack(currentTrack.id);
    } else {
      likeTrack(currentTrack.id);
    }
  };
  
  // Skip 15% of track when clicking on previous/next, unless we're near start/end
  const handleSkipBackward = () => {
    if (currentTime < 5) {
      playPrevious();
    } else {
      seekTo(0);
    }
  };

  const openFullscreen = () => {
    setFullscreenOpen(true);
  };

  const closeFullscreen = () => {
    setFullscreenOpen(false);
  };
  
  return (
    <>
      {/* Floating Comments */}
      <FloatingComments comments={topComments} isPlaying={isPlaying} />
      
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-3 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
          {/* Track Info - Apple Music style */}
          <div className="flex items-center space-x-3 w-full md:w-1/4">
            {currentTrack ? (
              <>
                <div 
                  className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg overflow-hidden cursor-pointer shadow-lg"
                  onClick={isMobile ? openFullscreen : undefined}
                >
                  <img 
                    src={currentTrack.cover || currentTrack.cover_art_path} 
                    alt="Album cover" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="truncate flex-1">
                  <Link to={`/track/${currentTrack.id}`} className="text-sm font-medium truncate hover:text-white text-gray-100 block">
                    {currentTrack.title}
                  </Link>
                  <Link to={`/artist/${encodeURIComponent(currentTrack.artist)}`} className="text-xs text-gray-400 truncate hover:text-white block">
                    {currentTrack.artist}
                  </Link>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white"
                  onClick={handleLikeToggle}
                >
                  <Heart className={`h-4 w-4 ${isTrackLiked(currentTrack.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </>
            ) : (
              <div className="flex items-center text-gray-400 text-sm italic">
                No track selected
              </div>
            )}
          </div>
          
          {/* Player Controls - Apple Music style */}
          <div className="flex flex-col space-y-2 w-full md:w-2/4">
            {/* On mobile, just show play/pause button */}
            {isMobile ? (
              <div className="flex items-center justify-center">
                <Button 
                  onClick={togglePlay}
                  className="h-10 w-10 rounded-full bg-white hover:bg-gray-200 text-black"
                  disabled={!currentTrack}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" /> 
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center space-x-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`text-gray-400 hover:text-white ${shuffle ? 'text-white' : ''}`}
                    onClick={() => setShuffle(!shuffle)}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-white"
                    onClick={handleSkipBackward}
                    disabled={!currentTrack}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button 
                    onClick={togglePlay}
                    className="h-10 w-10 rounded-full bg-white hover:bg-gray-200 text-black"
                    disabled={!currentTrack}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-5 w-5" /> 
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-white"
                    onClick={playNext}
                    disabled={!currentTrack || queue.length === 0}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`text-gray-400 hover:text-white ${repeat ? 'text-white' : ''}`}
                    onClick={() => setRepeat(!repeat)}
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 1}
                    step={1}
                    className="flex-1 [&_.relative]:bg-white/20 [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
                    onValueChange={(value) => seekTo(value[0])}
                    disabled={!currentTrack}
                  />
                  <span className="text-xs text-gray-400">{formatTime(duration)}</span>
                </div>
              </>
            )}
          </div>
          
          {/* Volume & Queue Controls */}
          <div className="flex items-center space-x-3 w-full md:w-1/4 justify-end">
            {/* Comments Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-black/95 border-white/10">
                <CommentsSection
                  comments={comments}
                  loading={commentsLoading}
                  onAddComment={addComment}
                />
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <ListMusic className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-black/95 border-white/10">
                <div className="h-full flex flex-col">
                  <h3 className="text-lg font-semibold mb-2 text-white">Queue</h3>
                  <Separator className="mb-4 bg-white/10" />
                  <ScrollArea className="flex-1">
                    {queue.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>Your queue is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {queue.map((track) => (
                          <div 
                            key={track.id}
                            className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/5 ${
                              currentTrack?.id === track.id ? 'bg-white/10' : ''
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
                              <h4 className="text-sm font-medium truncate text-white">{track.title}</h4>
                              <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 flex-shrink-0 text-gray-400 hover:text-white" 
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
                              className="h-8 w-8 flex-shrink-0 text-gray-400 hover:text-white" 
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
            
            {!isMobile && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  className="w-20 [&_.relative]:bg-white/20 [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
                  onValueChange={(value) => {
                    setVolume(value[0]);
                  }}
                />
              </>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-white"
              onClick={isMobile ? openFullscreen : undefined}
            >
              {isMobile ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile fullscreen player */}
      <MobileFullscreenPlayer 
        isOpen={fullscreenOpen && !!currentTrack} 
        onClose={closeFullscreen} 
      />
    </>
  );
};

export default MusicPlayer;
