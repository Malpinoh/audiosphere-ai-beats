
import { useState } from "react";
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
  Trash
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Mock data for comments
const mockComments = [
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
];

export function CommentsManagement() {
  const [comments, setComments] = useState(mockComments);
  const [searchTerm, setSearchTerm] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredComments = comments.filter(comment => 
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
    comment.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.song.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteComment = () => {
    if (commentToDelete) {
      setComments(comments.filter(comment => comment.id !== commentToDelete));
      setCommentToDelete(null);
      setDialogOpen(false);
      
      toast({
        title: "Comment deleted",
        description: "The comment has been permanently removed from the system.",
      });
    }
  };

  const handleToggleStatus = (commentId: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, status: comment.status === "active" ? "hidden" : "active" } 
        : comment
    ));
    
    const newStatus = comments.find(c => c.id === commentId)?.status === "active" ? "hidden" : "active";
    
    toast({
      title: `Comment ${newStatus === "active" ? "shown" : "hidden"}`,
      description: `The comment is now ${newStatus === "active" ? "visible to users" : "hidden from users"}.`,
    });
  };

  const handleToggleFlag = (commentId: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, flagged: !comment.flagged } 
        : comment
    ));
    
    const isFlagged = !comments.find(c => c.id === commentId)?.flagged;
    
    toast({
      title: isFlagged ? "Comment flagged" : "Flag removed",
      description: isFlagged 
        ? "The comment has been flagged for review." 
        : "The flag has been removed from this comment.",
    });
  };

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
                <Badge variant={comment.status === "active" ? "success" : "secondary"}>
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
                    variant={comment.flagged ? "success" : "warning"}
                    size="sm"
                    onClick={() => handleToggleFlag(comment.id)}
                    className={comment.flagged ? "bg-green-600 hover:bg-green-700 text-white" : ""}
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
