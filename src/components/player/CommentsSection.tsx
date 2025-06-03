
import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield } from 'lucide-react';
import { TrackComment } from '@/hooks/use-track-comments';
import { useAuth } from '@/contexts/AuthContext';

interface CommentsSectionProps {
  comments: TrackComment[];
  loading: boolean;
  onAddComment: (content: string) => Promise<boolean>;
}

export function CommentsSection({ comments, loading, onAddComment }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const success = await onAddComment(newComment);
    if (success) {
      setNewComment('');
    }
    setSubmitting(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <MessageSquare className="h-5 w-5 text-white" />
        <h3 className="font-medium text-white">Comments ({comments.length})</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {comment.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">
                      {comment.username}
                    </span>
                    {comment.is_verified && (
                      <Shield className="h-3 w-3 text-blue-400" />
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {user && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              maxLength={500}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newComment.trim() || submitting}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
