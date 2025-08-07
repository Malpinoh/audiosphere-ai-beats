import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Save, BarChart3, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrackCard } from "@/components/ui/track-card";
import { Track } from "@/types/track-types";

const LibraryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [savedTracks, setSavedTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    loadUserLibrary();
  }, [user, navigate]);

  const loadUserLibrary = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load liked tracks
      const { data: likes } = await supabase
        .from('likes')
        .select(`
          track_id,
          tracks (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (likes) {
        setLikedTracks(likes.map(like => like.tracks).filter(Boolean) as Track[]);
      }

      // Load saved tracks
      const { data: saved } = await supabase
        .from('saved_tracks')
        .select(`
          track_id,
          tracks (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (saved) {
        setSavedTracks(saved.map(save => save.tracks).filter(Boolean) as Track[]);
      }

      // Load recent tracks (most played by user from stream logs)
      const { data: streamLogs } = await supabase
        .from('stream_logs')
        .select(`
          track_id,
          created_at,
          tracks (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (streamLogs) {
        // Get unique tracks by track_id and sort by most recent
        const uniqueTracks = new Map();
        streamLogs.forEach(log => {
          if (log.tracks && !uniqueTracks.has(log.track_id)) {
            uniqueTracks.set(log.track_id, log.tracks);
          }
        });
        setRecentTracks(Array.from(uniqueTracks.values()) as Track[]);
      }
      
    } catch (error) {
      console.error('Error loading user library:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-maudio-dark text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your Library
          </h1>
          
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Liked
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="mostplayed" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Most Played
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent" className="mt-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Recently Played</h2>
                {loading ? (
                  <div className="text-gray-400">Loading...</div>
                ) : recentTracks.length > 0 ? (
                  <div className="space-y-1">
                    {recentTracks.map((track) => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">No recent tracks found</div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="liked" className="mt-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Liked Songs</h2>
                {loading ? (
                  <div className="text-gray-400">Loading...</div>
                ) : likedTracks.length > 0 ? (
                  <div className="space-y-1">
                    {likedTracks.map((track) => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">No liked tracks found</div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="saved" className="mt-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Saved Songs</h2>
                {loading ? (
                  <div className="text-gray-400">Loading...</div>
                ) : savedTracks.length > 0 ? (
                  <div className="space-y-1">
                    {savedTracks.map((track) => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">No saved tracks found</div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="mostplayed" className="mt-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Most Played</h2>
                {loading ? (
                  <div className="text-gray-400">Loading...</div>
                ) : recentTracks.length > 0 ? (
                  <div className="space-y-1">
                    {recentTracks.slice(0, 12).map((track) => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">No tracks found</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default LibraryPage;