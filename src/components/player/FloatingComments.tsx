
import { useEffect, useState } from 'react';
import { TrackComment } from '@/hooks/use-track-comments';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield } from 'lucide-react';

interface FloatingCommentsProps {
  comments: TrackComment[];
  isPlaying: boolean;
}

export function FloatingComments({ comments, isPlaying }: FloatingCommentsProps) {
  const [visibleComments, setVisibleComments] = useState<(TrackComment & { key: string })[]>([]);

  useEffect(() => {
    if (!isPlaying || comments.length === 0) {
      setVisibleComments([]);
      return;
    }

    const showComment = (comment: TrackComment, index: number) => {
      const commentWithKey = { ...comment, key: `${comment.id}-${Date.now()}` };
      
      setTimeout(() => {
        setVisibleComments(prev => [...prev, commentWithKey]);
        
        // Remove comment after 10 seconds
        setTimeout(() => {
          setVisibleComments(prev => prev.filter(c => c.key !== commentWithKey.key));
        }, 10000);
      }, index * 2000); // Stagger comments every 2 seconds
    };

    // Show comments with staggered timing
    comments.forEach((comment, index) => {
      showComment(comment, index);
    });

    // Cleanup function
    return () => {
      setVisibleComments([]);
    };
  }, [isPlaying, comments]);

  if (!isPlaying || visibleComments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        {visibleComments.map((comment, index) => (
          <div
            key={comment.key}
            className="absolute animate-fade-in bg-black/80 backdrop-blur-sm rounded-lg p-3 max-w-xs pointer-events-none"
            style={{
              top: `${20 + (index * 15)}%`,
              right: `${10 + Math.random() * 20}%`,
              animation: `float-${index % 3} 10s ease-in-out forwards`
            }}
          >
            <div className="flex items-start gap-2">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={comment.avatar_url} />
                <AvatarFallback className="text-xs">
                  {comment.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs font-medium text-white truncate">
                    {comment.username}
                  </span>
                  {comment.is_verified && (
                    <Shield className="h-3 w-3 text-blue-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-200 leading-tight">
                  {comment.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float-0 {
            0% { opacity: 0; transform: translateY(20px) translateX(50px); }
            10% { opacity: 1; transform: translateY(0) translateX(0); }
            90% { opacity: 1; transform: translateY(-10px) translateX(-20px); }
            100% { opacity: 0; transform: translateY(-30px) translateX(-40px); }
          }
          
          @keyframes float-1 {
            0% { opacity: 0; transform: translateY(30px) translateX(-30px); }
            10% { opacity: 1; transform: translateY(0) translateX(0); }
            90% { opacity: 1; transform: translateY(-15px) translateX(25px); }
            100% { opacity: 0; transform: translateY(-35px) translateX(50px); }
          }
          
          @keyframes float-2 {
            0% { opacity: 0; transform: translateY(25px) translateX(20px); }
            10% { opacity: 1; transform: translateY(0) translateX(0); }
            90% { opacity: 1; transform: translateY(-20px) translateX(-15px); }
            100% { opacity: 0; transform: translateY(-40px) translateX(-30px); }
          }
        `
      }} />
    </>
  );
}
