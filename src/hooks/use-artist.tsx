
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Artist {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  follower_count: number;
  is_verified: boolean;
  bio?: string;
  website?: string;
}

export function useArtist(artistId: string | undefined) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { user } = useAuth();

  // Fetch artist data and check follow status
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!artistId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', artistId)
          .single();
          
        if (error) {
          throw error;
        }
        
        setArtist(data as Artist);
        
        // Check if current user is following this artist
        if (user) {
          const { data: followData, error: followError } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', user.id)
            .eq('artist_id', artistId)
            .maybeSingle();
            
          if (followError) {
            console.error('Error checking follow status:', followError);
          } else {
            setIsFollowing(!!followData);
          }
        }
      } catch (error) {
        console.error('Error fetching artist data:', error);
        toast.error('Failed to load artist profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtistData();
    
    // Set up real-time listener for follower count updates
    const channel = supabase
      .channel('artist-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${artistId}`
        },
        (payload) => {
          const updatedArtist = payload.new as Artist;
          setArtist(prevArtist => {
            if (!prevArtist) return updatedArtist;
            return { ...prevArtist, follower_count: updatedArtist.follower_count };
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistId, user]);

  // Handle follow/unfollow
  const handleToggleFollow = async () => {
    if (!user) {
      toast.error('Please log in to follow artists');
      return;
    }
    
    if (!artist) return;
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        // Unfollow the artist
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('artist_id', artist.id);
          
        if (error) throw error;
        setIsFollowing(false);
        toast.success(`Unfollowed ${artist.full_name}`);
      } else {
        // Follow the artist
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            artist_id: artist.id
          });
          
        if (error) throw error;
        setIsFollowing(true);
        toast.success(`Following ${artist.full_name}`);
      }
    } catch (error: any) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status: ' + (error.message || 'Unknown error'));
    } finally {
      setFollowLoading(false);
    }
  };

  // Helper to get a placeholder image when avatar is missing
  const getAvatarImage = () => {
    if (artist?.avatar_url) return artist.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(artist?.full_name || "Artist")}&background=random`;
  };

  return { 
    artist, 
    loading, 
    isFollowing, 
    followLoading, 
    handleToggleFollow,
    getAvatarImage
  };
}
