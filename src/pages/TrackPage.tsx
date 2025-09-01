
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { useTrack } from "@/hooks/use-track";
import { useMusicPlayer } from "@/contexts/music-player";
import { useTrackComments } from "@/hooks/use-track-comments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, Heart, Share, Music, Bookmark, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CommentsSection } from "@/components/player/CommentsSection";

export default function TrackPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const { track, loading, error } = useTrack(trackId);
  const { comments, loading: commentsLoading, addComment } = useTrackComments(trackId || null);
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    togglePlay, 
    isTrackLiked,
    isTrackSaved,
    likeTrack,
    unlikeTrack,
    saveTrack,
    unsaveTrack,
    shareTrack
  } = useMusicPlayer();
  
  const isCurrentTrack = currentTrack?.id === track?.id;
  const hasAudioUrl = track?.audioUrl || track?.audio_file_path;
  
  const handlePlayPause = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else if (track) {
      playTrack(track);
    }
  };
  
  const handleLikeToggle = async () => {
    if (!track) return;
    
    if (isTrackLiked(track.id)) {
      await unlikeTrack(track.id);
    } else {
      await likeTrack(track.id);
    }
  };
  
  const handleSaveToggle = async () => {
    if (!track) return;
    
    if (isTrackSaved(track.id)) {
      await unsaveTrack(track.id);
    } else {
      await saveTrack(track.id);
    }
  };
  
  const handleShare = () => {
    if (!track) return;
    shareTrack(track.id);
  };
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <Skeleton className="aspect-square w-full rounded-lg" />
            </div>
            <div className="md:col-span-7 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="space-y-2 pt-4">
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-500">Error loading track</h2>
            <p className="text-muted-foreground mt-2">Please try again later</p>
          </div>
        ) : !track ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">Track not found</h2>
            <p className="text-muted-foreground mt-2">The track you're looking for doesn't exist or may have been removed</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <div className="relative group">
                <img 
                  src={track.cover || track.cover_art_path} 
                  alt={track.title}
                  className="w-full aspect-square object-cover rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button 
                    onClick={handlePlayPause}
                    size="icon"
                    className="h-20 w-20 rounded-full bg-primary/90 hover:bg-primary text-white shadow-xl"
                    disabled={!hasAudioUrl}
                  >
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="h-10 w-10" />
                    ) : (
                      <Play className="h-10 w-10 ml-1" />
                    )}
                  </Button>
                </div>
              </div>

              {!hasAudioUrl && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This track doesn't have an audio file attached.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="md:col-span-7 space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{track.title}</h1>
                <p className="text-xl text-muted-foreground mt-2">{track.artist}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                  {track.genre}
                </span>
                <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm">
                  {track.mood}
                </span>
                {track.tags?.map((tag, index) => (
                  <span key={index} className="bg-muted px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handlePlayPause}
                  size="lg"
                  className="w-full gap-2 maudio-gradient-bg"
                  disabled={!hasAudioUrl}
                >
                  {!hasAudioUrl ? (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      No Audio Available
                    </>
                  ) : isCurrentTrack && isPlaying ? (
                    <>
                      <Pause className="h-5 w-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Play Track
                    </>
                  )}
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className={`gap-2 flex-1 ${isTrackLiked(track.id) ? 'border-secondary' : ''}`}
                    onClick={handleLikeToggle}
                  >
                    <Heart className={`h-5 w-5 ${isTrackLiked(track.id) ? 'fill-secondary text-secondary' : ''}`} />
                    {isTrackLiked(track.id) ? 'Liked' : 'Like'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`gap-2 flex-1 ${isTrackSaved(track.id) ? 'border-secondary' : ''}`}
                    onClick={handleSaveToggle}
                  >
                    <Bookmark className={`h-5 w-5 ${isTrackSaved(track.id) ? 'fill-secondary text-secondary' : ''}`} />
                    {isTrackSaved(track.id) ? 'Saved' : 'Save'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2 flex-1"
                    onClick={handleShare}
                  >
                    <Share className="h-5 w-5" />
                    Share
                  </Button>
                </div>
              </div>
              
              {track.description && (
                <div>
                  <h3 className="text-lg font-medium mb-2">About this track</h3>
                  <p className="text-muted-foreground">{track.description}</p>
                </div>
              )}
              
              <div className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music className="h-4 w-4" />
                  {(track.play_count || 0) >= 1000 && (
                    <span>{track.play_count.toLocaleString()} plays</span>
                  )}
                  •
                  <Heart className="h-4 w-4" />
                  <span>{track.like_count || 0} likes</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="md:col-span-12 mt-8">
              <div className="bg-maudio-darker rounded-lg p-6">
                <CommentsSection
                  comments={comments}
                  loading={commentsLoading}
                  onAddComment={addComment}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
