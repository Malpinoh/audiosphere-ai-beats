
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
  parent_id?: string;
  replies?: TrackComment[];
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
        console.log('Fetching comments for track:', trackId);
        
        // Try to fetch from the view first
        let { data, error } = await supabase
          .from('comments_with_details')
          .select('*')
          .eq('track_id', trackId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('View query failed, trying direct join:', error);
          
          // Fallback to direct join
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('comments')
            .select(`
              *,
              profiles:user_id (
                username,
                avatar_url,
                follower_count,
                is_verified
              )
            `)
            .eq('track_id', trackId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          if (fallbackError) {
            console.error("Fallback query also failed:", fallbackError);
            return;
          }

          // Transform fallback data to match expected format
          data = fallbackData?.map(comment => ({
            id: comment.id,
            content: comment.content,
            username: comment.profiles?.username || 'Anonymous',
            avatar_url: comment.profiles?.avatar_url,
            follower_count: comment.profiles?.follower_count || 0,
            is_verified: comment.profiles?.is_verified || false,
            created_at: comment.created_at,
            likes_count: comment.likes_count || 0,
            user_id: comment.user_id,
            parent_id: comment.parent_id,
            flagged: comment.flagged || false,
            status: comment.status,
            track_artist: '',
            track_id: comment.track_id,
            track_title: ''
          })) || [];
        }

        const transformedComments: TrackComment[] = (data || []).map(comment => ({
          id: comment.id,
          content: comment.content,
          username: comment.username || 'Anonymous',
          avatar_url: comment.avatar_url,
          follower_count: comment.follower_count || 0,
          is_verified: comment.is_verified || false,
          created_at: comment.created_at,
          likes_count: comment.likes_count || 0,
          user_id: comment.user_id,
          parent_id: (comment as any).parent_id || undefined
        }));

        // Organize comments into hierarchical structure
        const commentsMap = new Map<string, TrackComment>();
        const rootComments: TrackComment[] = [];

        // First pass: create map of all comments
        transformedComments.forEach(comment => {
          comment.replies = [];
          commentsMap.set(comment.id, comment);
        });

        // Second pass: organize into hierarchy
        transformedComments.forEach(comment => {
          if (comment.parent_id) {
            const parent = commentsMap.get(comment.parent_id);
            if (parent) {
              parent.replies!.push(comment);
            }
          } else {
            rootComments.push(comment);
          }
        });

        setComments(rootComments);
        console.log('Comments loaded successfully:', transformedComments.length);
      } catch (error) {
        console.error("Error fetching track comments:", error);
        toast.error("Failed to load comments");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Set up real-time subscription
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

  const addComment = async (content: string, parentId?: string) => {
    if (!trackId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to comment");
        return false;
      }

      console.log('Adding comment for track:', trackId);

      const { error } = await supabase
        .from('comments')
        .insert({
          track_id: trackId,
          user_id: user.id,
          content: content.trim(),
          status: 'active',
          parent_id: parentId || null
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

  const getTopComments = () => {
    return [...comments]
      .sort((a, b) => {
        const scoreA = (a.follower_count || 0) + (a.is_verified ? 1000 : 0) + (a.likes_count || 0) * 10;
        const scoreB = (b.follower_count || 0) + (b.is_verified ? 1000 : 0) + (b.likes_count || 0) * 10;
        return scoreB - scoreA;
      })
      .slice(0, 5);
  };

  const reportComment = async (commentId: string, reason: string, description?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to report comments");
        return false;
      }

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          comment_id: commentId,
          reason,
          description: description?.trim() || null
        });

      if (error) {
        console.error("Error reporting comment:", error);
        toast.error("Failed to report comment");
        return false;
      }

      toast.success("Comment reported successfully");
      return true;
    } catch (error) {
      console.error("Error reporting comment:", error);
      toast.error("Failed to report comment");
      return false;
    }
  };

  return {
    comments,
    loading,
    addComment,
    getTopComments,
    reportComment
  };
}
