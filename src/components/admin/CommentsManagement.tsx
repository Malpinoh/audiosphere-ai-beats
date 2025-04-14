
import { Loader2 } from "lucide-react";
import { CommentsList } from "./comments/CommentsList";
import { useComments } from "./comments/useComments";

export function CommentsManagement() {
  const { 
    comments, 
    loading, 
    tableExists,
    handleUpdateStatus, 
    handleFlagComment, 
    handleDeleteComment 
  } = useComments();

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
      <div>
        <h2 className="text-2xl font-bold">Manage Comments</h2>
        <p className="text-muted-foreground">Review and moderate user comments</p>
      </div>

      <CommentsList
        comments={comments}
        onUpdateStatus={handleUpdateStatus}
        onFlagComment={handleFlagComment}
        onDeleteComment={handleDeleteComment}
      />

      {!tableExists && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
          <p className="font-medium">Using mock comment data</p>
          <p className="mt-1">The comments table doesn't exist in your database yet. The data shown is mock data for demonstration purposes.</p>
        </div>
      )}
    </div>
  );
}
