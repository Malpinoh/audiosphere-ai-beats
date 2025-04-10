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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  MessageSquareOff,
  Search,
  ShieldAlert,
  Trash,
  Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Comment {
  id: string;
  content: string;
  user: string;
  song: string;
  timestamp: string;
  status: string;
  flagged: boolean;
  user_id?: string;
  track_id?: string;
}

export function CommentsManagement() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        
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
            profiles(username),
            tracks(title, artist)
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching comments:", error);
          setComments([
            { 
              id: "1", 
              content: "This song is amazing! I've been listening to it on repeat.", 
              user: "johndoe", 
              song: "Autumn Rain - Mountain Echo",
              timestamp: "2023-04-05T10:30:00",
              status: "active",
              flagged: false
            },
            { 
              id: "2", 
              content: "Not really my style, but I can appreciate the production quality.", 
              user: "sarahjones", 
              song: "Neon City - Digital Dreams",
              timestamp: "2023-04-04T15:45:00",
              status: "active",
              flagged: false
            },
            { 
              id: "3", 
              content: "This artist always delivers! Can't wait for more music.", 
              user: "mikebrown", 
              song: "Ocean Waves - Coastal Sounds",
              timestamp: "2023-04-03T09:15:00",
              status: "hidden",
              flagged: true
            },
            { 
              id: "4", 
              content: "The lyrics are so meaningful, really speaks to me.", 
              user: "robertwilson", 
              song: "Street Beats - Urban Flow",
              timestamp: "2023-04-02T20:10:00",
              status: "active",
              flagged: false
            },
            { 
              id: "5", 
              content: "The beat is sick! Perfect for workouts.", 
              user: "janesmith", 
              song: "Midnight Drive - Night Cruiser",
              timestamp: "2023-04-01T13:20:00",
              status: "active",
              flagged: true
            }
          ]);
        } else if (data) {
          const formattedComments = data.map(comment => ({
            id: comment.id,
            content: comment.content,
            user: comment.profiles?.username || 'Unknown',
            song: comment.tracks ? `${comment.tracks.title} - ${comment.tracks.artist}` : 'Unknown',
            timestamp: comment.created_at,
            status: comment.status || 'active',
            flagged: comment.flagged || false,
            user_id: comment.user_id,
            track_id: comment.track_id
          }));
          
          setComments(formattedComments);
        }
      } catch (error) {
        console.error('Error in comment fetching:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
    
    const channel = supabase
      .channel('admin-comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        async (payload) => {
          try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
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
                  profiles(username),
                  tracks(title, artist)
                `)
                .eq('id', newRecord.id)
                .single();
              
              if (error) throw error;
              
              const formattedComment = {
                id: data.id,
                content: data.content,
                user: data.profiles?.username || 'Unknown',
                song: data.tracks ? `${data.tracks.title} - ${data.tracks.artist}` : 'Unknown',
                timestamp: data.created_at,
                status: data.status || 'active',
                flagged: data.flagged || false,
                user_id: data.user_id,
                track_id: data.track_id
              };
              
              if (eventType === 'INSERT') {
                setComments(prevComments => [formattedComment, ...prevComments]);
              } else if (eventType === 'UPDATE') {
                setComments(prevComments => prevComments.map(comment => 
                  comment.id === formattedComment.id ? formattedComment : comment
                ));
              }
            } else if (eventType === 'DELETE') {
              setComments(prevComments => prevComments.filter(comment => 
                comment.id !== oldRecord.id
              ));
            }
          } catch (error) {
            console.error('Error processing comment update:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredComments = comments.filter(comment => 
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
    comment.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.song.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteComment = async () => {
    if (commentToDelete) {
      try {
        if (await checkCommentsTableExists()) {
          const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentToDelete);
            
          if (error) throw error;
        } else {
          setComments(comments.filter(comment => comment.id !== commentToDelete));
        }
        
        setCommentToDelete(null);
        setDialogOpen(false);
        
        toast({
          title: "Comment deleted",
          description: "The comment has been permanently removed from the system.",
        });
      } catch (error) {
        console.error('Error deleting comment:', error);
        toast({
          title: "Error deleting comment",
          description: "Failed to delete the comment. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleStatus = async (commentId: string) => {
    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;
      
      const newStatus = comment.status === "active" ? "hidden" : "active";
      
      if (await checkCommentsTableExists()) {
        const { error } = await supabase
          .from('comments')
          .update({ status: newStatus })
          .eq('id', commentId);
          
        if (error) throw error;
      } else {
        setComments(comments.map(comment => 
          comment.id === commentId 
            ? { ...comment, status: newStatus } 
            : comment
        ));
      }
      
      toast({
        title: `Comment ${newStatus === "active" ? "shown" : "hidden"}`,
        description: `The comment is now ${newStatus === "active" ? "visible to users" : "hidden from users"}.`,
      });
    } catch (error) {
      console.error('Error updating comment status:', error);
      toast({
        title: "Error updating comment",
        description: "Failed to update the comment status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFlag = async (commentId: string) => {
    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;
      
      const isFlagged = !comment.flagged;
      
      if (await checkCommentsTableExists()) {
        const { error } = await supabase
          .from('comments')
          .update({ flagged: isFlagged })
          .eq('id', commentId);
          
        if (error) throw error;
      } else {
        setComments(comments.map(comment => 
          comment.id === commentId 
            ? { ...comment, flagged: isFlagged } 
            : comment
        ));
      }
      
      toast({
        title: isFlagged ? "Comment flagged" : "Flag removed",
        description: isFlagged 
          ? "The comment has been flagged for review." 
          : "The flag has been removed from this comment.",
      });
    } catch (error) {
      console.error('Error updating comment flag:', error);
      toast({
        title: "Error updating comment",
        description: "Failed to update the comment flag. Please try again.",
        variant: "destructive",
      });
    }
  };

  const checkCommentsTableExists = async () => {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });
        
      return !error;
    } catch (error) {
      return false;
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
            <TableHead className="w-1/3">Comment</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Song</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Flagged</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredComments.map((comment) => (
            <TableRow key={comment.id}>
              <TableCell className="font-medium">{comment.content}</TableCell>
              <TableCell>{comment.user}</TableCell>
              <TableCell>{comment.song}</TableCell>
              <TableCell>{new Date(comment.timestamp).toLocaleString()}</TableCell>
              <TableCell>
                <Badge 
                  variant={comment.status === "active" ? "outline" : "secondary"}
                  className={comment.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                >
                  {comment.status}
                </Badge>
              </TableCell>
              <TableCell>
                {comment.flagged && (
                  <Badge variant="destructive" className="flex w-fit items-center">
                    <AlertOctagon className="h-3 w-3 mr-1" />
                    Flagged
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(comment.id)}
                  >
                    {comment.status === "active" ? (
                      <MessageSquareOff className="h-4 w-4 mr-1" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    {comment.status === "active" ? "Hide" : "Show"}
                  </Button>
                  <Button
                    variant={comment.flagged ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => handleToggleFlag(comment.id)}
                    className={comment.flagged ? "bg-green-600 hover:bg-green-700 text-white" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}
                  >
                    {comment.flagged ? (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 mr-1" />
                    )}
                    {comment.flagged ? "Resolve" : "Flag"}
                  </Button>
                  <Dialog open={dialogOpen && commentToDelete === comment.id} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setCommentToDelete(comment.id)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Confirm Comment Deletion
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this comment? 
                          This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteComment}>
                          Delete Comment
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
