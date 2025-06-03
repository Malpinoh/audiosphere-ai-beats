
import { 
  MoreVertical, 
  CheckCircle, 
  EyeOff, 
  Flag, 
  Trash2,
  Shield 
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Comment } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommentItemProps {
  comment: Comment;
  onUpdateStatus: (commentId: string, status: "active" | "hidden" | "deleted") => void;
  onFlagComment: (commentId: string, flagged: boolean) => void;
  onDeleteComment: (commentId: string) => void;
}

export function CommentItem({ 
  comment, 
  onUpdateStatus, 
  onFlagComment, 
  onDeleteComment 
}: CommentItemProps) {
  return (
    <TableRow key={comment.id}>
      <TableCell className="max-w-md">
        <div className="truncate">{comment.content}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={comment.avatar_url} />
            <AvatarFallback>{comment.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1">
            <span>{comment.username}</span>
            {comment.is_verified && (
              <Shield className="h-3 w-3 text-blue-500" />
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{comment.track_title}</span>
          <span className="text-sm text-muted-foreground">{comment.track_artist}</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">{new Date(comment.created_at).toLocaleDateString()}</TableCell>
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
      <TableCell className="hidden md:table-cell">
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
              onClick={() => onUpdateStatus(comment.id, "active")}
              disabled={comment.status === "active"}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Active
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdateStatus(comment.id, "hidden")}
              disabled={comment.status === "hidden"}
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Hide Comment
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onFlagComment(comment.id, !comment.flagged)}
            >
              <Flag className="mr-2 h-4 w-4" />
              {comment.flagged ? "Remove Flag" : "Flag Comment"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteComment(comment.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Comment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
