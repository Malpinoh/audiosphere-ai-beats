
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Comment } from "./types";

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        toast.error("Failed to load comments");
        setTableExists(false);
        return;
      }

      // Transform the data to match our Comment interface
      const transformedComments: Comment[] = (data || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        username: comment.username,
        avatar_url: comment.avatar_url,
        follower_count: comment.follower_count || 0,
        is_verified: comment.is_verified || false,
        track_title: comment.track_title,
        track_artist: comment.track_artist,
        created_at: comment.created_at,
        status: comment.status,
        flagged: comment.flagged || false,
        user_id: comment.user_id,
        track_id: comment.track_id,
        likes_count: comment.likes_count || 0
      }));

      setComments(transformedComments);
      setTableExists(true);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
      setTableExists(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, status: "active" | "hidden" | "deleted") => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error("Error updating comment status:", error);
        toast.error("Failed to update comment status");
        return;
      }

      // Update local state
      setComments(prev => 
        prev.map(comment => 
          comment.id === id ? { ...comment, status } : comment
        )
      );
      toast.success(`Comment status updated to ${status}`);
    } catch (error) {
      console.error("Error updating comment status:", error);
      toast.error("Failed to update comment status");
    }
  }, []);

  const handleFlagComment = useCallback(async (id: string, flagged: boolean) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ flagged })
        .eq('id', id);

      if (error) {
        console.error("Error updating comment flag:", error);
        toast.error("Failed to update comment flag");
        return;
      }

      // Update local state
      setComments(prev => 
        prev.map(comment => 
          comment.id === id ? { ...comment, flagged } : comment
        )
      );
      toast.success(flagged ? "Comment flagged for review" : "Comment flag removed");
    } catch (error) {
      console.error("Error updating comment flag:", error);
      toast.error("Failed to update comment flag");
    }
  }, []);

  const handleDeleteComment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting comment:", error);
        toast.error("Failed to delete comment");
        return;
      }

      // Update local state
      setComments(prev => prev.filter(comment => comment.id !== id));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  }, []);

  useEffect(() => {
    fetchComments();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('comments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comments' }, 
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchComments]);

  return {
    comments,
    loading,
    tableExists,
    handleUpdateStatus,
    handleFlagComment,
    handleDeleteComment
  };
}
