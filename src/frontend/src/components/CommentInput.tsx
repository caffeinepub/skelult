import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { usePostComment } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { VideoId } from '../backend';

interface CommentInputProps {
  videoId: VideoId;
}

export default function CommentInput({ videoId }: CommentInputProps) {
  const { identity } = useInternetIdentity();
  const [comment, setComment] = useState('');
  const postComment = usePostComment();
  const isAuthenticated = !!identity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }

    if (!comment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      await postComment.mutateAsync({ videoId, text: comment.trim() });
      setComment('');
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to post comment');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Please login to comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Add a comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={postComment.isPending}
        className="rounded-xl min-h-[80px] resize-none"
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={postComment.isPending || !comment.trim()}
          className="rounded-xl bg-primary hover:bg-primary/90 neon-glow"
        >
          {postComment.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Post Comment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

