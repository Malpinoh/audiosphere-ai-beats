
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMockFormattedComments, checkTableExists } from "../helpers/mockData";
import { Comment } from "./types";

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [tableExists, setTableExists] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        
        // Check if the comments table exists
        const exists = await checkTableExists('comments', supabase);
        setTableExists(exists);
        
        if (exists) {
          // This code would work once the table is created in Supabase
          console.log("Comments table exists, fetching data");
          
          // Placeholder database fetching code that would work when table exists
          const { data, error } = await supabase
            .from('comments')
            .select(`
              id, 
              content, 
              created_at, 
              status, 
              flagged,
              user_id,
              track_id,
              profiles (username),
              tracks (title, artist)
            `);
            
          if (error) throw error;
          
          if (data) {
            setComments(data as Comment[]);
          }
        } else {
          // Use mock data
          const mockComments = getMockFormattedComments();
          setComments(mockComments as Comment[]);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: "Error loading comments",
          description: "Could not load comments data. Using mock data instead.",
          variant: "destructive",
        });
        // Fallback to mock data on error
        const mockComments = getMockFormattedComments();
        setComments(mockComments as Comment[]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [toast]);

  const handleUpdateStatus = async (commentId: string, status: "active" | "hidden" | "deleted") => {
    try {
      if (tableExists) {
        // This would be the real implementation once the table exists
        console.log("Updating comment status:", commentId, status);
        
        const { error } = await supabase
          .from('comments')
          .update({ status })
          .eq('id', commentId);
          
        if (error) throw error;
      }
      
      // Always update local state for the UI
      setComments(comments.map(comment => 
        comment.id === commentId ? { ...comment, status } : comment
      ));
      
      toast({
        title: "Comment status updated",
        description: `Comment has been marked as ${status}.`,
      });
    } catch (error) {
      console.error('Error updating comment status:', error);
      toast({
        title: "Error updating comment",
        description: "Could not update the comment status.",
        variant: "destructive",
      });
    }
  };

  const handleFlagComment = async (commentId: string, flagged: boolean) => {
    try {
      if (tableExists) {
        // This would be the real implementation once the table exists
        console.log("Updating comment flag:", commentId, flagged);
        
        const { error } = await supabase
          .from('comments')
          .update({ flagged })
          .eq('id', commentId);
          
        if (error) throw error;
      }
      
      // Always update local state for the UI
      setComments(comments.map(comment => 
        comment.id === commentId ? { ...comment, flagged } : comment
      ));
      
      toast({
        title: flagged ? "Comment flagged" : "Comment unflagged",
        description: flagged 
          ? "Comment has been flagged for review." 
          : "Flag has been removed from the comment.",
      });
    } catch (error) {
      console.error('Error flagging comment:', error);
      toast({
        title: "Error updating comment",
        description: "Could not update the comment flag status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      if (tableExists) {
        // This would be the real implementation once the table exists
        console.log("Deleting comment:", commentId);
        
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);
          
        if (error) throw error;
      }
      
      // Always update local state for the UI
      setComments(comments.filter(comment => comment.id !== commentId));
      
      toast({
        title: "Comment deleted",
        description: "The comment has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error deleting comment",
        description: "Could not delete the comment.",
        variant: "destructive",
      });
    }
  };

  return {
    comments,
    loading,
    tableExists,
    handleUpdateStatus,
    handleFlagComment,
    handleDeleteComment
  };
}
