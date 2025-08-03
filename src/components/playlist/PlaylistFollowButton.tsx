import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Heart, HeartOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PlaylistFollowButtonProps {
  playlistId: string;
  followerCount: number;
  onFollowerCountChange: (newCount: number) => void;
}

export function PlaylistFollowButton({ 
  playlistId, 
  followerCount, 
  onFollowerCountChange 
}: PlaylistFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkFollowStatus();
    }
  }, [user, playlistId]);

  // Real-time subscription for follower count
  useEffect(() => {
    const channel = supabase
      .channel(`playlist-followers-${playlistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlist_followers',
          filter: `playlist_id=eq.${playlistId}`
        },
        () => {
          // Refresh follower count when changes occur
          refreshFollowerCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playlistId]);

  const checkFollowStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('playlist_followers')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('profile_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const refreshFollowerCount = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('follower_count')
        .eq('id', playlistId)
        .single();

      if (!error && data) {
        onFollowerCountChange(data.follower_count || 0);
      }
    } catch (error) {
      console.error('Error refreshing follower count:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast.error('Please log in to follow playlists');
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('playlist_followers')
          .delete()
          .eq('playlist_id', playlistId)
          .eq('profile_id', user.id);

        if (error) {
          console.error('Error unfollowing playlist:', error);
          toast.error('Failed to unfollow playlist');
          return;
        }

        setIsFollowing(false);
        toast.success('Playlist unfollowed');
      } else {
        // Follow
        const { error } = await supabase
          .from('playlist_followers')
          .insert({
            playlist_id: playlistId,
            profile_id: user.id
          });

        if (error) {
          console.error('Error following playlist:', error);
          toast.error('Failed to follow playlist');
          return;
        }

        setIsFollowing(true);
        toast.success('Playlist followed');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={toggleFollow}
        disabled={loading}
        variant={isFollowing ? "default" : "outline"}
        size="sm"
        className={isFollowing 
          ? "maudio-gradient-bg" 
          : "border-white/20 text-white hover:bg-white/10"
        }
      >
        {isFollowing ? (
          <>
            <Heart className="h-4 w-4 mr-2 fill-current" />
            Following
          </>
        ) : (
          <>
            <HeartOff className="h-4 w-4 mr-2" />
            Follow
          </>
        )}
      </Button>
      <span className="text-sm text-muted-foreground">
        {followerCount} follower{followerCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}