
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ArtistProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  follower_count: number;
  monthly_listeners: number;
  is_verified: boolean;
  role: string;
}

export function useArtistProfile(artistId?: string) {
  const { user, profile } = useAuth();
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const targetArtistId = artistId || user?.id;

  useEffect(() => {
    const fetchArtistProfile = async () => {
      if (!targetArtistId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetArtistId)
          .single();
          
        if (error) throw error;
        
        setArtistProfile(data as ArtistProfile);
        
        // Check if current user is following this artist
        if (user && targetArtistId !== user.id) {
          const { data: followData } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', user.id)
            .eq('artist_id', targetArtistId)
            .maybeSingle();
            
          setIsFollowing(!!followData);
        }
      } catch (error) {
        console.error('Error fetching artist profile:', error);
        toast.error('Failed to load artist profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtistProfile();
    
    // Set up real-time listener for profile updates
    const channel = supabase
      .channel('artist-profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${targetArtistId}`
        },
        (payload) => {
          setArtistProfile(payload.new as ArtistProfile);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'followers',
          filter: `artist_id=eq.${targetArtistId}`
        },
        () => {
          // Refetch profile to get updated follower count
          fetchArtistProfile();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetArtistId, user]);

  const updateProfile = async (updates: Partial<ArtistProfile>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    }
  };

  const toggleFollow = async () => {
    if (!user || !targetArtistId) {
      toast.error('Please log in to follow artists');
      return;
    }
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('artist_id', targetArtistId);
          
        if (error) throw error;
        setIsFollowing(false);
        toast.success(`Unfollowed ${artistProfile?.full_name}`);
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            artist_id: targetArtistId
          });
          
        if (error) throw error;
        setIsFollowing(true);
        toast.success(`Following ${artistProfile?.full_name}`);
      }
    } catch (error: any) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  return {
    artistProfile,
    loading,
    isFollowing,
    followLoading,
    updateProfile,
    toggleFollow
  };
}
