import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ArtistProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  follower_count: number;
  monthly_listeners: number;
  is_verified: boolean;
  role: string;
  claimable?: boolean;
  auto_created?: boolean;
}

export function useArtistProfile(artistSlugOrId?: string) {
  const { user, profile } = useAuth();
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const targetArtistSlugOrId = artistSlugOrId || user?.id;

  useEffect(() => {
    const fetchArtistProfile = async () => {
      if (!targetArtistSlugOrId) return;
      
      try {
        setLoading(true);
        
        // Check if it's a UUID (legacy support) or a slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetArtistSlugOrId);
        
        let { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, website, follower_count, monthly_listeners, is_verified, role, claimable, auto_created, slug')
          .eq(isUUID ? 'id' : 'slug', targetArtistSlugOrId)
          .maybeSingle();
          
        // If slug search failed, try by username or full_name as fallback
        if (!data && !error && !isUUID) {
          const { data: nameData, error: nameError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio, website, follower_count, monthly_listeners, is_verified, role, claimable, auto_created, slug')
            .or(`username.ilike.${targetArtistSlugOrId},full_name.ilike.${targetArtistSlugOrId}`)
            .eq('role', 'artist')
            .limit(1)
            .maybeSingle();
            
          data = nameData;
          error = nameError;
        }
          
        if (error) throw error;
        
        // Map the database response to our interface
        const mappedProfile: ArtistProfile = {
          id: data.id,
          username: data.username,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          bio: data.bio,
          website: data.website,
          follower_count: data.follower_count || 0,
          monthly_listeners: data.monthly_listeners || 0,
          is_verified: data.is_verified || false,
          role: data.role,
          claimable: data.claimable || false,
          auto_created: data.auto_created || false
        };
        
        setArtistProfile(mappedProfile);
        
        // Check if current user is following this artist
        if (user && data && data.id !== user.id) {
          const { data: followData } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', user.id)
            .eq('artist_id', data.id)
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
          filter: `id=eq.${artistProfile?.id}`
        },
        (payload) => {
          const mappedProfile: ArtistProfile = {
            id: payload.new.id,
            username: payload.new.username,
            full_name: payload.new.full_name,
            avatar_url: payload.new.avatar_url,
            bio: payload.new.bio,
            website: payload.new.website,
            follower_count: payload.new.follower_count || 0,
            monthly_listeners: payload.new.monthly_listeners || 0,
            is_verified: payload.new.is_verified || false,
            role: payload.new.role,
            claimable: payload.new.claimable || false,
            auto_created: payload.new.auto_created || false
          };
          setArtistProfile(mappedProfile);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'followers',
          filter: `artist_id=eq.${artistProfile?.id}`
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
  }, [targetArtistSlugOrId, user]);

  const updateProfile = async (updates: Partial<ArtistProfile>) => {
    if (!user) return;
    
    try {
      // Filter out fields that don't exist in the database table
      const dbUpdates: any = {};
      if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name;
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.website !== undefined) dbUpdates.website = updates.website;
      if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
      
      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
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
    if (!user || !artistProfile?.id) {
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
          .eq('artist_id', artistProfile.id);
          
        if (error) throw error;
        setIsFollowing(false);
        toast.success(`Unfollowed ${artistProfile?.full_name}`);
      } else {
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            artist_id: artistProfile.id
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
