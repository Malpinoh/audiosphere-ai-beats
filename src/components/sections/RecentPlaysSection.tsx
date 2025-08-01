import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Track } from "@/types/track-types";
import { TrackCard } from "@/components/ui/track-card";
import { Clock } from "lucide-react";

export function RecentPlaysSection() {
  const { user } = useAuth();
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecentTracks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadRecentTracks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
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
        .limit(8);

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
      console.error('Error loading recent tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (!loading && recentTracks.length === 0)) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Recently Played</h2>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentTracks.slice(0, 8).map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      )}
    </section>
  );
}