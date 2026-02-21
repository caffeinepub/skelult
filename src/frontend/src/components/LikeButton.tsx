import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useLikeVideo } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { VideoId } from '../backend';

interface LikeButtonProps {
  videoId: VideoId;
  initialLikes: number;
}

export default function LikeButton({ videoId, initialLikes }: LikeButtonProps) {
  const { identity } = useInternetIdentity();
  const likeVideo = useLikeVideo();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const isAuthenticated = !!identity;

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to like videos');
      return;
    }

    if (isLiked) {
      toast.info('You already liked this video');
      return;
    }

    // Optimistic update
    setIsLiked(true);
    setLikes(prev => prev + 1);

    try {
      await likeVideo.mutateAsync(videoId);
    } catch (error: any) {
      // Revert on error
      setIsLiked(false);
      setLikes(prev => prev - 1);
      
      if (error.message?.includes('already liked')) {
        toast.info('You already liked this video');
      } else {
        toast.error('Failed to like video');
      }
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={!isAuthenticated || likeVideo.isPending}
      className={`flex items-center gap-2 transition-all ${
        isLiked
          ? 'text-primary'
          : 'text-muted-foreground hover:text-primary'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Heart 
        className={`h-5 w-5 transition-all ${isLiked ? 'fill-current animate-pulse-neon' : ''}`}
      />
      <span className="text-sm font-medium">{likes}</span>
    </button>
  );
}

