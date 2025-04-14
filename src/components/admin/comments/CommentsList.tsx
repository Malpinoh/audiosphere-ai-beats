
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CommentItem } from "./CommentItem";
import { Comment } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface CommentsListProps {
  comments: Comment[];
  onUpdateStatus: (commentId: string, status: "active" | "hidden" | "deleted") => void;
  onFlagComment: (commentId: string, flagged: boolean) => void;
  onDeleteComment: (commentId: string) => void;
}

export function CommentsList({ 
  comments, 
  onUpdateStatus, 
  onFlagComment, 
  onDeleteComment 
}: CommentsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  
  const filteredComments = comments.filter(comment => 
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.profiles.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.tracks.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.tracks.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative w-full md:w-72 ml-auto">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search comments..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableCaption>Manage user comments across the platform.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Comment</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Track</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Flagged</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredComments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 5 : 7} className="text-center py-6">
                  No comments found
                </TableCell>
              </TableRow>
            ) : (
              filteredComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onUpdateStatus={onUpdateStatus}
                  onFlagComment={onFlagComment}
                  onDeleteComment={onDeleteComment}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
