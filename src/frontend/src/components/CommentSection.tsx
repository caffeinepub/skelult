import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from '@tanstack/react-router';
import { useGetVideoComments, useGetUserProfile } from '../hooks/useQueries';
import { formatDistanceToNow } from 'date-fns';
import type { VideoId } from '../backend';
import { Loader2 } from 'lucide-react';

interface CommentSectionProps {
  videoId: VideoId;
}

function CommentItem({ comment }: { comment: any }) {
  const navigate = useNavigate();
  const { data: authorProfile } = useGetUserProfile(comment.author.toString());
  const commentDate = new Date(Number(comment.timestamp) / 1000000);

  const handleProfileClick = () => {
    navigate({ to: '/profile/$userId', params: { userId: comment.author.toString() } });
  };

  return (
    <div className="flex gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors">
      <Avatar 
        className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        onClick={handleProfileClick}
      >
        <AvatarImage src={authorProfile?.profilePicture?.getDirectURL()} />
        <AvatarFallback className="bg-gradient-neon text-white text-xs">
          {authorProfile?.username?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p 
            className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
            onClick={handleProfileClick}
          >
            {authorProfile?.username || 'Unknown User'}
          </p>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(commentDate, { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-foreground break-words">{comment.text}</p>
      </div>
    </div>
  );
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const { data: comments, isLoading } = useGetVideoComments(videoId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const commentCount = comments?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-lg">Comments</h3>
        <Badge variant="secondary" className="rounded-full">
          {commentCount}
        </Badge>
      </div>

      {commentCount === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <ScrollArea className="h-[400px] rounded-xl border border-border/50">
          <div className="space-y-1 p-2">
            {comments?.map((comment, index) => (
              <CommentItem key={index} comment={comment} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

