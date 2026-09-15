import { useState, useEffect, useCallback } from 'react';
import { Button } from "@web/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@shared/integrations/supabase/client";
import { useAuth } from "@web/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PlaylistFollowButtonProps {
  playlistId: string;
  followerCount: number;
  onFollowerCountChange: (newCount: number) => void;
}

export function PlaylistFollowButton({
  playlistId,
  followerCount,
  onFollowerCountChange,
}: PlaylistFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const refreshFollowerCount = useCallback(async () => {
    const { data, error } = await supabase
      .from('playlists')
      .select('follower_count')
      .eq('id', playlistId)
      .maybeSingle();
    if (!error && data) onFollowerCountChange(data.follower_count || 0);
  }, [playlistId, onFollowerCountChange]);

  const checkFollowStatus = useCallback(async () => {
    if (!user) { setIsFollowing(false); return; }
    const { data, error } = await supabase
      .from('playlist_followers')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('profile_id', user.id)
      .maybeSingle();
    if (error) {
      console.error('Error checking playlist follow status:', error);
      return;
    }
    setIsFollowing(!!data);
  }, [user, playlistId]);

  useEffect(() => { checkFollowStatus(); }, [checkFollowStatus]);

  useEffect(() => {
    const channel = supabase
      .channel(`playlist-followers-${playlistId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'playlist_followers', filter: `playlist_id=eq.${playlistId}` },
        () => { refreshFollowerCount(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [playlistId, refreshFollowerCount]);

  const toggleFollow = async () => {
    if (!user) {
      toast.error('Sign in to follow playlists', { duration: 2500 });
      navigate('/auth');
      return;
    }

    setLoading(true);
    // Optimistic UI — reverted if the request fails.
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      if (!next) {
        const { error } = await supabase
          .from('playlist_followers')
          .delete()
          .eq('playlist_id', playlistId)
          .eq('profile_id', user.id);
        if (error) throw error;
        toast.success('Unfollowed playlist', { duration: 2500 });
      } else {
        const { error } = await supabase
          .from('playlist_followers')
          .insert({ playlist_id: playlistId, profile_id: user.id });
        // 23505 = already following; treat as success (idempotent).
        if (error && error.code !== '23505') throw error;
        toast.success('Following playlist', { duration: 2500 });
      }
      await refreshFollowerCount();
    } catch (error: any) {
      console.error('Error toggling playlist follow:', error);
      setIsFollowing(!next);
      toast.error("Couldn't update follow — please try again", { duration: 2500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={toggleFollow}
        disabled={loading}
        variant={isFollowing ? "default" : "outline"}
        size="sm"
        aria-pressed={isFollowing}
        aria-label={isFollowing ? "Unfollow playlist" : "Follow playlist"}
        className={`gap-1.5 ${isFollowing ? "maudio-gradient-bg" : ""}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
        )}
        {isFollowing ? "Following" : "Follow"}
      </Button>
      <span className="text-sm text-muted-foreground">
        {followerCount} follower{followerCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
