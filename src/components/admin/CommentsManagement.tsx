
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, 
  Search, 
  Loader2, 
  Flag, 
  CheckCircle, 
  EyeOff, 
  Trash2 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMockFormattedComments, checkTableExists } from "./helpers/mockData";

interface Comment {
  id: string;
  content: string;
  profiles: { username: string };
  tracks: { title: string; artist: string };
  created_at: string;
  status: "active" | "hidden" | "deleted";
  flagged: boolean;
  user_id: string;
  track_id: string;
}

export function CommentsManagement() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
          // Fetch from real database
          const { data, error } = await supabase
            .from('comments')
            .select(`
              id, 
              content, 
              profiles:user_id (username),
              tracks:track_id (title, artist),
              created_at,
              status,
              flagged,
              user_id,
              track_id
            `)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          setComments(data as Comment[]);
        } else {
          // Use mock data
          setComments(getMockFormattedComments());
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: "Error loading comments",
          description: "Could not load comments data. Using mock data instead.",
          variant: "destructive",
        });
        // Fallback to mock data on error
        setComments(getMockFormattedComments());
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
    
    // Set up real-time listener only if the table exists
    if (tableExists) {
      const channel = supabase
        .channel('admin-comments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments'
          },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT') {
              // Fetch the full comment with joins
              fetchComment(newRecord.id).then(comment => {
                if (comment) {
                  setComments(prevComments => [comment, ...prevComments]);
                }
              });
            } else if (eventType === 'UPDATE') {
              // Fetch the updated comment with joins
              fetchComment(newRecord.id).then(comment => {
                if (comment) {
                  setComments(prevComments => prevComments.map(c => 
                    c.id === comment.id ? comment : c
                  ));
                }
              });
            } else if (eventType === 'DELETE') {
              setComments(prevComments => prevComments.filter(c => c.id !== oldRecord.id));
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [toast, tableExists]);
  
  // Helper function to fetch a single comment with its relationships
  const fetchComment = async (commentId: string) => {
    if (!tableExists) return null;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, 
          content, 
          profiles:user_id (username),
          tracks:track_id (title, artist),
          created_at,
          status,
          flagged,
          user_id,
          track_id
        `)
        .eq('id', commentId)
        .single();
        
      if (error) throw error;
      return data as Comment;
    } catch (error) {
      console.error('Error fetching comment:', error);
      return null;
    }
  };

  const filteredComments = comments.filter(comment => 
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.profiles.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.tracks.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.tracks.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateStatus = async (commentId: string, status: "active" | "hidden" | "deleted") => {
    try {
      if (tableExists) {
        // Update in database
        const { error } = await supabase
          .from('comments')
          .update({ status })
          .eq('id', commentId);
          
        if (error) throw error;
      }
      
      // Always update local state
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
        // Update in database
        const { error } = await supabase
          .from('comments')
          .update({ flagged })
          .eq('id', commentId);
          
        if (error) throw error;
      }
      
      // Always update local state
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
        // Delete from database
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);
          
        if (error) throw error;
      }
      
      // Always update local state
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Comments</h2>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableCaption>Manage user comments across the platform.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Comment</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Track</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Flagged</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredComments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">
                No comments found
              </TableCell>
            </TableRow>
          ) : (
            filteredComments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell className="max-w-md">
                  <div className="truncate">{comment.content}</div>
                </TableCell>
                <TableCell>{comment.profiles.username}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{comment.tracks.title}</span>
                    <span className="text-sm text-muted-foreground">{comment.tracks.artist}</span>
                  </div>
                </TableCell>
                <TableCell>{new Date(comment.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      comment.status === "active" 
                        ? "outline" 
                        : comment.status === "hidden" 
                          ? "secondary" 
                          : "destructive"
                    }
                    className={
                      comment.status === "active" 
                        ? "bg-green-100 text-green-800 hover:bg-green-200" 
                        : ""
                    }
                  >
                    {comment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {comment.flagged ? (
                    <Badge variant="destructive">Flagged</Badge>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(comment.id, "active")}
                        disabled={comment.status === "active"}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Active
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(comment.id, "hidden")}
                        disabled={comment.status === "hidden"}
                      >
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide Comment
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleFlagComment(comment.id, !comment.flagged)}
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        {comment.flagged ? "Remove Flag" : "Flag Comment"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Comment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!tableExists && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
          <p className="font-medium">Using mock comment data</p>
          <p className="mt-1">The comments table doesn't exist in your database yet. The data shown is mock data for demonstration purposes.</p>
        </div>
      )}
    </div>
  );
}
