import { useMusicPlayer } from "@/contexts/music-player";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Repeat1, Shuffle, Heart, MoreHorizontal, Maximize2, ListMusic,
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
import { formatTime } from "@/utils/formatTime";
import { QualitySelector, type AudioQualityTier } from "@/components/player/QualitySelector";
import { HiResBadge } from "@/components/player/HiResBadge";
import { useAudioPreferences } from "@/hooks/use-audio-preferences";
import { CommentsSection } from "@/components/player/CommentsSection";

const MusicPlayer = () => {
  const { 
    currentTrack, isPlaying, currentTime, duration, volume, isMuted,
    isLoading, repeatMode, isShuffle, queue,
    togglePlay, playNext, playPrevious, seekTo, setVolume,
    toggleMute, toggleRepeat, toggleShuffle, clearQueue,
    playTrack, removeFromQueue, likeTrack, unlikeTrack, isTrackLiked
  } = useMusicPlayer();
  
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<AudioQualityTier>('auto');
  const isMobile = useIsMobile();
  const { preferences, updatePreference } = useAudioPreferences();
  const { comments, loading: commentsLoading, addComment, getTopComments } = useTrackComments(currentTrack?.id || null);

  const handleQualityChange = (quality: AudioQualityTier) => {
    setCurrentQuality(quality);
    if (quality !== 'auto') {
      updatePreference('preferredQuality', quality as 'normal' | 'high' | 'hifi' | 'hires');
      updatePreference('autoQuality', false);
    } else {
      updatePreference('autoQuality', true);
    }
  };

  const handleLikeToggle = () => {
    if (!currentTrack) return;
    if (isTrackLiked(currentTrack.id)) {
      unlikeTrack(currentTrack.id);
    } else {
      likeTrack(currentTrack.id);
    }
  };
  
  const handleSkipBackward = () => {
    if (currentTime < 5) {
      playPrevious();
    } else {
      seekTo(0);
    }
  };

  return (
    <>
      <div className={`fixed ${isMobile ? 'bottom-14' : 'bottom-0'} left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-3 z-40`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center space-x-3 w-full md:w-1/4">
            {currentTrack ? (
              <>
                <div 
                  className="h-12 w-12 maudio-gradient-bg rounded-lg overflow-hidden cursor-pointer shadow-lg flex-shrink-0"
                  onClick={isMobile ? () => setFullscreenOpen(true) : undefined}
                >
                  <img 
                    src={currentTrack.cover_art_path ? 
                      `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${currentTrack.cover_art_path}` : 
                      'https://picsum.photos/300/300'
                    } 
                    alt="Album cover" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300';
                    }}
                  />
                </div>
                <div className="truncate flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/track/${currentTrack.id}`} className="text-sm font-medium truncate hover:text-foreground text-foreground block">
                      {currentTrack.title}
                    </Link>
                    <HiResBadge 
                      isHiRes={currentTrack.is_hires} 
                      isLossless={currentTrack.is_lossless}
                      maxQuality={currentTrack.max_quality}
                      size="sm"
                    />
                  </div>
                  <Link to={`/artist/${encodeURIComponent(currentTrack.artist)}`} className="text-xs text-muted-foreground truncate hover:text-foreground block">
                    {currentTrack.artist}
                  </Link>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={handleLikeToggle}
                >
                  <Heart className={`h-4 w-4 ${isTrackLiked(currentTrack.id) ? 'fill-destructive text-destructive' : ''}`} />
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
            {isMobile ? (
              <div className="flex items-center justify-center">
                <Button 
                  onClick={togglePlay}
                  className="h-10 w-10 rounded-full maudio-gradient-bg hover:opacity-90"
                  disabled={!currentTrack}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
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
                  <Button variant="ghost" size="icon" className={`text-muted-foreground hover:text-foreground ${isShuffle ? 'text-primary' : ''}`} onClick={toggleShuffle}>
                    <Shuffle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={handleSkipBackward} disabled={!currentTrack}>
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button onClick={togglePlay} className="h-10 w-10 rounded-full maudio-gradient-bg hover:opacity-90" disabled={!currentTrack}>
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-5 w-5" /> 
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={playNext} disabled={!currentTrack || queue.length === 0}>
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className={`text-muted-foreground hover:text-foreground transition-all duration-200 ${repeatMode !== 'off' ? 'text-primary' : ''}`} onClick={toggleRepeat}>
                    {repeatMode === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
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
              </>
            )}
          </div>
          
          {/* Volume & Queue Controls */}
          <div className="flex items-center space-x-2 w-full md:w-1/4 justify-end">
            <QualitySelector
              currentQuality={currentQuality}
              availableQualities={['normal', 'high']}
              onQualityChange={handleQualityChange}
              isAdaptive={currentQuality === 'auto'}
            />

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <CommentsSection comments={comments} loading={commentsLoading} onAddComment={addComment} />
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <ListMusic className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-foreground">Queue</h3>
                    {queue.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearQueue} className="text-muted-foreground hover:text-foreground">
                        Clear All
                      </Button>
                    )}
                  </div>
                  <Separator className="mb-4" />
                  <ScrollArea className="flex-1">
                    {queue.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Your queue is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {queue.map((track) => (
                          <div key={track.id} className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted ${currentTrack?.id === track.id ? 'bg-muted' : ''}`}>
                            <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden">
                              <img 
                                src={track.cover_art_path ? 
                                  `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${track.cover_art_path}` : 
                                  'https://picsum.photos/300/300'
                                } 
                                alt={track.title} 
                                className="h-full w-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300'; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate text-foreground">{track.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground" onClick={() => playTrack(track)}>
                              {currentTrack?.id === track.id && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground" onClick={() => removeFromQueue(track.id)}>
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
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  className="w-20"
                  onValueChange={(value) => setVolume(value[0])}
                />
              </>
            )}
            
            {isMobile && (
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setFullscreenOpen(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <MobileFullscreenPlayer isOpen={fullscreenOpen && !!currentTrack} onClose={() => setFullscreenOpen(false)} />
    </>
  );
};

export default MusicPlayer;
