import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetUserVideos } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Video } from 'lucide-react';

interface VideoLinkPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVideo: (videoId: string) => void;
}

export default function VideoLinkPicker({ open, onOpenChange, onSelectVideo }: VideoLinkPickerProps) {
  const { identity } = useInternetIdentity();
  const userId = identity?.getPrincipal();
  const { data: videos, isLoading } = useGetUserVideos(userId!);

  if (!identity || !userId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select a Video to Share</DialogTitle>
          <DialogDescription>
            Choose one of your uploaded videos to share in the conversation
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : videos && videos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {videos.map((video) => (
                <button
                  key={video.id.toString()}
                  onClick={() => onSelectVideo(video.id.toString())}
                  className="group relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                >
                  <video
                    src={video.videoFile.getDirectURL()}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm font-medium truncate">{video.title}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <Video className="h-12 w-12 mb-4 opacity-50" />
              <p>You haven't uploaded any videos yet.</p>
              <p className="text-sm mt-2">Upload a video first to share it in messages.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
