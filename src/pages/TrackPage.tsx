import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { useTrack } from "@/hooks/use-track";
import { useMusicPlayer } from "@/contexts/music-player";
import { useTrackComments } from "@/hooks/use-track-comments";
import { useSimilarTracks } from "@/hooks/use-recommendations";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackCard } from "@/components/ui/track-card";
import { Play, Pause, Heart, Share, Music, Bookmark, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CommentsSection } from "@/components/player/CommentsSection";
import { useIsMobile } from "@/hooks/use-mobile";

export default function TrackPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const { track, loading, error } = useTrack(trackId);
  const { comments, loading: commentsLoading, addComment } = useTrackComments(trackId || null);
  const { tracks: similarTracks, loading: similarLoading } = useSimilarTracks(trackId || null, 6);
  const isMobile = useIsMobile();
  const {
    currentTrack, isPlaying, playTrack, togglePlay,
    isTrackLiked, isTrackSaved, likeTrack, unlikeTrack,
    saveTrack, unsaveTrack, shareTrack
  } = useMusicPlayer();

  const isCurrentTrack = currentTrack?.id === track?.id;
  const hasAudioUrl = track?.audioUrl || track?.audio_file_path;

  const handlePlayPause = () => { isCurrentTrack ? togglePlay() : track && playTrack(track); };
  const handleLikeToggle = async () => { if (!track) return; isTrackLiked(track.id) ? await unlikeTrack(track.id) : await likeTrack(track.id); };
  const handleSaveToggle = async () => { if (!track) return; isTrackSaved(track.id) ? await unsaveTrack(track.id) : await saveTrack(track.id); };
  const handleShare = () => { track && shareTrack(track.id); };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {loading ? (
          <div className={`${isMobile ? 'flex flex-col items-center' : 'grid md:grid-cols-12 gap-6'}`}>
            <div className={isMobile ? 'w-full max-w-[280px]' : 'md:col-span-5'}>
              <Skeleton className="aspect-square w-full rounded-xl" />
            </div>
            <div className={`${isMobile ? 'w-full mt-4' : 'md:col-span-7'} space-y-4`}>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : error || !track ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">{error ? 'Error loading track' : 'Track not found'}</h2>
            <p className="text-muted-foreground mt-2">{error ? 'Please try again' : 'This track may have been removed'}</p>
          </div>
        ) : (
          <div className={isMobile ? 'flex flex-col' : 'grid md:grid-cols-12 gap-6'}>
            {/* Cover Art */}
            <div className={isMobile ? 'flex justify-center mb-5' : 'md:col-span-5'}>
              <div className={`relative group ${isMobile ? 'w-full max-w-[260px]' : 'w-full'}`}>
                <img
                  src={track.cover || track.cover_art_path}
                  alt={track.title}
                  className="w-full aspect-square object-cover rounded-xl shadow-lg"
                />
                {!isMobile && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button onClick={handlePlayPause} size="icon"
                      className="h-16 w-16 rounded-full bg-primary/90 hover:bg-primary shadow-xl" disabled={!hasAudioUrl}>
                      {isCurrentTrack && isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className={`${isMobile ? '' : 'md:col-span-7'} space-y-4`}>
              <div className={isMobile ? 'text-center' : ''}>
                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold`}>{track.title}</h1>
                <p className="text-lg text-muted-foreground mt-1">{track.artist}</p>
              </div>

              <div className={`flex flex-wrap gap-1.5 ${isMobile ? 'justify-center' : ''}`}>
                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-medium">{track.genre}</span>
                <span className="bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full text-xs font-medium">{track.mood}</span>
                {track.tags?.map((tag, i) => (
                  <span key={i} className="bg-muted px-2.5 py-0.5 rounded-full text-xs">{tag}</span>
                ))}
              </div>

              {!hasAudioUrl && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No audio file available.</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Button onClick={handlePlayPause} size="lg" className="w-full gap-2 maudio-gradient-bg" disabled={!hasAudioUrl}>
                  {!hasAudioUrl ? <><AlertCircle className="h-5 w-5" />No Audio</> :
                    isCurrentTrack && isPlaying ? <><Pause className="h-5 w-5" />Pause</> : <><Play className="h-5 w-5" />Play</>}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className={`gap-1.5 flex-1 text-sm ${isTrackLiked(track.id) ? 'border-destructive/30' : ''}`} onClick={handleLikeToggle}>
                    <Heart className={`h-4 w-4 ${isTrackLiked(track.id) ? 'fill-destructive text-destructive' : ''}`} />
                    {isTrackLiked(track.id) ? 'Liked' : 'Like'}
                  </Button>
                  <Button variant="outline" className={`gap-1.5 flex-1 text-sm ${isTrackSaved(track.id) ? 'border-primary/30' : ''}`} onClick={handleSaveToggle}>
                    <Bookmark className={`h-4 w-4 ${isTrackSaved(track.id) ? 'fill-primary text-primary' : ''}`} />
                    {isTrackSaved(track.id) ? 'Saved' : 'Save'}
                  </Button>
                  <Button variant="outline" className="gap-1.5 flex-1 text-sm" onClick={handleShare}>
                    <Share className="h-4 w-4" />Share
                  </Button>
                </div>
              </div>

              {track.description && (
                <div>
                  <h3 className="text-sm font-medium mb-1">About</h3>
                  <p className="text-muted-foreground text-sm">{track.description}</p>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Music className="h-3.5 w-3.5" />{(track.play_count || 0).toLocaleString()} plays</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{track.like_count || 0} likes</span>
              </div>
            </div>

            {/* Similar Tracks */}
            <div className={`${isMobile ? '' : 'md:col-span-12'} mt-6`}>
              <h2 className="text-xl font-bold mb-3">Similar Tracks</h2>
              {similarLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                    </div>
                  ))}
                </div>
              ) : similarTracks.length > 0 ? (
                <div className="space-y-0.5">
                  {similarTracks.map((st) => (
                    <TrackCard key={st.id} variant="list" track={{
                      id: st.id, title: st.title, artist: st.artist, cover_art_path: st.cover,
                      audio_file_path: "", genre: st.genre, mood: st.mood,
                      play_count: st.plays, like_count: 0, tags: [], published: true,
                      user_id: st.artistId, duration: 0
                    }} />
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-sm py-4">No similar tracks found</p>}
            </div>

            {/* Comments */}
            <div className={`${isMobile ? '' : 'md:col-span-12'} mt-6`}>
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <CommentsSection comments={comments} loading={commentsLoading} onAddComment={addComment} />
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
