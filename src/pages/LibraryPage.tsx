import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Save, BarChart3, Clock, Download, WifiOff, Play, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrackCard } from "@/components/ui/track-card";
import { Track } from "@/types/track-types";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { listDownloads, listOfflineMix, deleteDownload, offlineToTrack, getCacheUsage, clearCache, OfflineTrack } from "@/lib/offline/storage";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/music-player";
import { toast } from "sonner";
import { hapticLight } from "@/lib/native";

const LibraryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setQueue, playTrack } = useMusicPlayer();
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [savedTracks, setSavedTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState<OfflineTrack[]>([]);
  const [offlineMix, setOfflineMix] = useState<OfflineTrack[]>([]);
  const [cache, setCache] = useState<{ used: number; limit: number }>({ used: 0, limit: 0 });

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadUserLibrary();
    refreshOffline();
  }, [user, navigate]);

  const refreshOffline = async () => {
    try {
      const [d, m, c] = await Promise.all([listDownloads(), listOfflineMix(), getCacheUsage()]);
      setDownloads(d); setOfflineMix(m); setCache(c);
    } catch (e) { console.error('offline refresh failed', e); }
  };

  const loadUserLibrary = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: likes } = await supabase.from('likes').select('track_id, tracks (*)').eq('user_id', user.id).order('created_at', { ascending: false });
      if (likes) setLikedTracks(likes.map(like => like.tracks).filter(Boolean) as Track[]);

      const { data: saved } = await supabase.from('saved_tracks').select('track_id, tracks (*)').eq('user_id', user.id).order('created_at', { ascending: false });
      if (saved) setSavedTracks(saved.map(save => save.tracks).filter(Boolean) as Track[]);

      const { data: streamLogs } = await supabase.from('stream_logs').select('track_id, created_at, tracks (*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      if (streamLogs) {
        const uniqueTracks = new Map();
        streamLogs.forEach(log => { if (log.tracks && !uniqueTracks.has(log.track_id)) uniqueTracks.set(log.track_id, log.tracks); });
        setRecentTracks(Array.from(uniqueTracks.values()) as Track[]);
      }
    } catch (error) {
      console.error('Error loading user library:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const LoadingList = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5">
          <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );

  const TrackList = ({ tracks, emptyMessage }: { tracks: Track[]; emptyMessage: string }) => (
    loading ? <LoadingList /> : tracks.length > 0 ? (
      <div className="space-y-0.5">
        {tracks.map((track) => <TrackCard key={track.id} track={track} variant="list" />)}
      </div>
    ) : <EmptyState message={emptyMessage} />
  );

  const playOfflineMix = () => {
    if (offlineMix.length === 0) {
      toast.info("No offline tracks yet — download something first", { duration: 2500 });
      return;
    }
    hapticLight();
    const tracks = offlineMix.map(offlineToTrack) as Track[];
    setQueue(tracks, { kind: 'playlist', name: 'Offline Mix' });
    playTrack(tracks[0]);
  };

  const onDeleteDownload = async (trackId: string) => {
    await deleteDownload(trackId);
    refreshOffline();
    toast.success("Removed from downloads", { duration: 2500 });
  };

  const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(0)} MB`;

  const OfflineList = ({ items, emptyMessage, showDelete }: { items: OfflineTrack[]; emptyMessage: string; showDelete?: boolean }) => (
    items.length === 0 ? <EmptyState message={emptyMessage} /> : (
      <div className="space-y-0.5">
        {items.map((o) => {
          const t = offlineToTrack(o) as Track;
          return (
            <div key={o.track_id} className="flex items-center gap-2">
              <div className="flex-1"><TrackCard track={t} variant="list" /></div>
              {showDelete && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteDownload(o.track_id)} aria-label="Remove download">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    )
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-6 text-foreground`}>
            Your Library
          </h1>

          <Tabs defaultValue="recent" className="w-full">
            <TabsList className={`${isMobile ? 'grid grid-cols-6 w-full' : 'inline-flex'} bg-muted border border-border`}>
              <TabsTrigger value="recent" className="gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5" />
                {!isMobile && 'Recent'}
                {isMobile && 'Recent'}
              </TabsTrigger>
              <TabsTrigger value="liked" className="gap-1.5 text-xs">
                <Heart className="h-3.5 w-3.5" />
                Liked
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-1.5 text-xs">
                <Save className="h-3.5 w-3.5" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="mostplayed" className="gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                {isMobile ? 'Top' : 'Most Played'}
              </TabsTrigger>
              <TabsTrigger value="downloads" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                {isMobile ? 'DL' : 'Downloads'}
              </TabsTrigger>
              <TabsTrigger value="offlinemix" className="gap-1.5 text-xs">
                <WifiOff className="h-3.5 w-3.5" />
                {isMobile ? 'Off' : 'Offline Mix'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-5">
              <TrackList tracks={recentTracks} emptyMessage="No recent tracks found" />
            </TabsContent>
            <TabsContent value="liked" className="mt-5">
              <TrackList tracks={likedTracks} emptyMessage="No liked tracks yet" />
            </TabsContent>
            <TabsContent value="saved" className="mt-5">
              <TrackList tracks={savedTracks} emptyMessage="No saved tracks yet" />
            </TabsContent>
            <TabsContent value="mostplayed" className="mt-5">
              <TrackList tracks={recentTracks.slice(0, 12)} emptyMessage="No tracks found" />
            </TabsContent>

            <TabsContent value="downloads" className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {downloads.length} downloaded {downloads.length === 1 ? 'song' : 'songs'} — plays without internet
                </p>
              </div>
              <OfflineList items={downloads} emptyMessage="No downloads yet — tap the download icon on any track" showDelete />
            </TabsContent>

            <TabsContent value="offlinemix" className="mt-5 space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-4 flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <WifiOff className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">Offline Mix</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {offlineMix.length} tracks · cache {formatMB(cache.used)} / {formatMB(cache.limit)}
                  </p>
                </div>
                <Button onClick={playOfflineMix} disabled={offlineMix.length === 0}
                  className="h-10 w-10 rounded-full bg-primary text-primary-foreground p-0 flex-shrink-0" aria-label="Play offline mix">
                  <Play className="h-5 w-5 ml-0.5 fill-primary-foreground" />
                </Button>
              </div>
              <OfflineList items={offlineMix} emptyMessage="Nothing cached yet — play a song while online to add it here" />
              {cache.used > 0 && (
                <Button variant="outline" size="sm" onClick={async () => { await clearCache(); refreshOffline(); toast.success('Cache cleared', { duration: 2500 }); }}>
                  Clear cache
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default LibraryPage;
