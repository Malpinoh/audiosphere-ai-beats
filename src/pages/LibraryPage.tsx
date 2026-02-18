import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Save, BarChart3, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrackCard } from "@/components/ui/track-card";
import { Track } from "@/types/track-types";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const LibraryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [savedTracks, setSavedTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadUserLibrary();
  }, [user, navigate]);

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

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-6 text-foreground`}>
            Your Library
          </h1>

          <Tabs defaultValue="recent" className="w-full">
            <TabsList className={`${isMobile ? 'grid grid-cols-4 w-full' : 'inline-flex'} bg-muted border border-border`}>
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
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default LibraryPage;
