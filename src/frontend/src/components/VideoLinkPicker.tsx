import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetUserVideos } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VideoLinkPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVideo: (videoId: string) => void;
}

export default function VideoLinkPicker({ open, onOpenChange, onSelectVideo }: VideoLinkPickerProps) {
  const { identity } = useInternetIdentity();
  const userId = identity?.getPrincipal().toString();
  const { data: videos, isLoading } = useGetUserVideos(userId!);

  if (!identity || !userId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient">Select a Video</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            {videos.map((video) => (
              <button
                key={video.id.toString()}
                onClick={() => onSelectVideo(video.id.toString())}
                className="group relative aspect-video rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-all"
              >
                <video
                  src={video.videoFile.getDirectURL()}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-semibold text-white text-sm line-clamp-2">{video.title}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {Number(video.likes)} likes
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>You haven't uploaded any videos yet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
