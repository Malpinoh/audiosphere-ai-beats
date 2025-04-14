
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
      // Use mock data by default - the comments table doesn't exist in the supabase schema
      setTableExists(false);
      const mockComments = getMockComments();
      setComments(mockComments as Comment[]);
      
      // If in the future the comments table is created, this code will be ready to use it
      // For now, we won't attempt to check for or query a non-existent table
      // which would cause TypeScript errors
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
      // Update local state for mock data
      setComments(prev => 
        prev.map(comment => 
          comment.id === id ? { ...comment, status } : comment
        )
      );
      toast.success(`Comment status updated to ${status}`);
      
      // In the future, if the table exists, we would add code here to update the database
    } catch (error) {
      console.error("Error updating comment status:", error);
      toast.error("Failed to update comment status");
    }
  }, []);

  const handleFlagComment = useCallback(async (id: string, flagged: boolean) => {
    try {
      // Update local state for mock data
      setComments(prev => 
        prev.map(comment => 
          comment.id === id ? { ...comment, flagged } : comment
        )
      );
      toast.success(flagged ? "Comment flagged for review" : "Comment flag removed");
      
      // In the future, if the table exists, we would add code here to update the database
    } catch (error) {
      console.error("Error updating comment flag:", error);
      toast.error("Failed to update comment flag");
    }
  }, []);

  const handleDeleteComment = useCallback(async (id: string) => {
    try {
      // Update local state for mock data
      setComments(prev => prev.filter(comment => comment.id !== id));
      toast.success("Comment deleted");
      
      // In the future, if the table exists, we would add code here to update the database
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  }, []);

  useEffect(() => {
    fetchComments();
    
    // No need for a subscription since we're using mock data
    // In the future, if the table exists, we would set up a subscription here
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
