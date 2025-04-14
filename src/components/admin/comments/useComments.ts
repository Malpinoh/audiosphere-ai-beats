
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Comment } from "./types";
import { getMockComments } from "../helpers/mockData";

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      // Check if the comments table exists in the database
      const { error: checkError } = await supabase
        .from('comments')
        .select('id')
        .limit(1)
        .single();

      // If there's an error (table doesn't exist), use mock data
      if (checkError) {
        if (checkError.code === "42P01") { // PostgreSQL code for "relation does not exist"
          setTableExists(false);
          // Use mock data
          const mockComments = getMockComments();
          setComments(mockComments as Comment[]);
        } else {
          console.error("Error checking comments table:", checkError);
          toast.error("Failed to load comments");
        }
      } else {
        setTableExists(true);
        // Table exists, fetch real data
        const { data, error } = await supabase
          .from('comments')
          .select(`
            id, content, created_at, status, flagged, user_id, track_id,
            profiles:user_id (username),
            tracks:track_id (title, artist)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Ensure the fetched data matches our Comment type
        const typedComments = data.map(comment => ({
          ...comment,
          status: comment.status as "active" | "hidden" | "deleted",
          profiles: comment.profiles || { username: "Unknown" },
          tracks: comment.tracks || { title: "Unknown", artist: "Unknown" }
        }));

        setComments(typedComments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
      
      // Fallback to mock data on error
      const mockComments = getMockComments();
      setComments(mockComments as Comment[]);
      setTableExists(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, status: "active" | "hidden" | "deleted") => {
    try {
      if (!tableExists) {
        // Update local state only for mock data
        setComments(prev => 
          prev.map(comment => 
            comment.id === id ? { ...comment, status } : comment
          )
        );
        toast.success(`Comment status updated to ${status}`);
        return;
      }

      // Update in database for real data
      const { error } = await supabase
        .from('comments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

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
  }, [tableExists]);

  const handleFlagComment = useCallback(async (id: string, flagged: boolean) => {
    try {
      if (!tableExists) {
        // Update local state only for mock data
        setComments(prev => 
          prev.map(comment => 
            comment.id === id ? { ...comment, flagged } : comment
          )
        );
        toast.success(flagged ? "Comment flagged for review" : "Comment flag removed");
        return;
      }

      // Update in database for real data
      const { error } = await supabase
        .from('comments')
        .update({ flagged })
        .eq('id', id);

      if (error) throw error;

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
  }, [tableExists]);

  const handleDeleteComment = useCallback(async (id: string) => {
    try {
      if (!tableExists) {
        // Update local state only for mock data
        setComments(prev => prev.filter(comment => comment.id !== id));
        toast.success("Comment deleted");
        return;
      }

      // Delete from database for real data
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setComments(prev => prev.filter(comment => comment.id !== id));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  }, [tableExists]);

  useEffect(() => {
    fetchComments();

    // Set up a subscription for real-time updates if the table exists
    let subscription: any;
    
    if (tableExists) {
      subscription = supabase
        .channel('comments-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'comments' 
        }, fetchComments)
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [fetchComments, tableExists]);

  return {
    comments,
    loading,
    tableExists,
    handleUpdateStatus,
    handleFlagComment,
    handleDeleteComment
  };
}
