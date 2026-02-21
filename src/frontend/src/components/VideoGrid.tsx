import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Play, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Video } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useDeleteVideo } from '../hooks/useQueries';

interface VideoGridProps {
  videos: Video[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const deleteVideo = useDeleteVideo();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    setVideoToDelete(video);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (videoToDelete) {
      deleteVideo.mutate(videoToDelete.id);
    }
    setShowDeleteDialog(false);
    setVideoToDelete(null);
  };

  const isOwnVideo = (video: Video) => {
    return identity && video.uploader.toString() === identity.getPrincipal().toString();
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No videos yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={video.id.toString()}
            onClick={() => navigate({ to: '/video/$videoId', params: { videoId: video.id.toString() } })}
            className="group relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 border-border/50 hover:border-primary/50 transition-all hover:shadow-neon"
          >
            <video
              src={video.videoFile.getDirectURL()}
              poster="/assets/generated/video-placeholder.dim_1920x1080.png"
              className="w-full h-full object-cover"
            />
            
            {/* Delete Button */}
            {isOwnVideo(video) && (
              <button
                onClick={(e) => handleDeleteClick(e, video)}
                disabled={deleteVideo.isPending}
                className="absolute top-3 right-3 z-10 bg-black/70 hover:bg-destructive/90 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Delete video"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-primary/90 rounded-full p-4 neon-glow">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
              <h3 className="font-bold text-white line-clamp-2 mb-2">{video.title}</h3>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Badge variant="secondary" className="rounded-full text-xs">
                  {Number(video.likes)} likes
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVideoToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
