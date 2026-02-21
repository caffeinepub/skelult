import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import type { VideoId } from '../backend';

interface ShareButtonProps {
  videoId: VideoId;
}

export default function ShareButton({ videoId }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const videoUrl = `${window.location.origin}/video/${videoId.toString()}`;
    
    try {
      await navigator.clipboard.writeText(videoUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors ml-auto"
    >
      <Share2 className="h-5 w-5" />
    </button>
  );
}

