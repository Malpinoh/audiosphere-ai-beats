
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TrackComment {
  id: string;
  content: string;
  username: string;
  avatar_url?: string;
  follower_count: number;
  is_verified: boolean;
  created_at: string;
  likes_count: number;
  user_id: string;
}

export function useTrackComments(trackId: string | null) {
  const [comments, setComments] = useState<TrackComment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trackId) {
      setComments([]);
      return;
    }

    const fetchComments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('comments_with_details')
          .select('*')
          .eq('track_id', trackId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching track comments:", error);
          return;
        }

        const transformedComments: TrackComment[] = (data || []).map(comment => ({
          id: comment.id,
          content: comment.content,
          username: comment.username,
          avatar_url: comment.avatar_url,
          follower_count: comment.follower_count || 0,
          is_verified: comment.is_verified || false,
          created_at: comment.created_at,
          likes_count: comment.likes_count || 0,
          user_id: comment.user_id
        }));

        setComments(transformedComments);
      } catch (error) {
        console.error("Error fetching track comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Set up real-time subscription for this track's comments
    const subscription = supabase
      .channel(`track-comments-${trackId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comments',
          filter: `track_id=eq.${trackId}`
        }, 
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [trackId]);

  const addComment = async (content: string) => {
    if (!trackId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to comment");
        return false;
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          track_id: trackId,
          user_id: user.id,
          content: content.trim()
        });

      if (error) {
        console.error("Error adding comment:", error);
        toast.error("Failed to add comment");
        return false;
      }

      toast.success("Comment added!");
      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      return false;
    }
  };

  // Get top 5 comments based on user engagement (followers + verification)
  const getTopComments = () => {
    return [...comments]
      .sort((a, b) => {
        const scoreA = (a.follower_count || 0) + (a.is_verified ? 1000 : 0) + (a.likes_count || 0) * 10;
        const scoreB = (b.follower_count || 0) + (b.is_verified ? 1000 : 0) + (b.likes_count || 0) * 10;
        return scoreB - scoreA;
      })
      .slice(0, 5);
  };

  return {
    comments,
    loading,
    addComment,
    getTopComments
  };
}
