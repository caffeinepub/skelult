import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
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
import { Video, ContentType } from '../backend';
import { useDeleteVideo } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface VideoGridProps {
  videos: Video[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  const navigate = useNavigate();

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No videos uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <VideoGridItem key={video.id.toString()} video={video} />
      ))}
    </div>
  );
}

function VideoGridItem({ video }: { video: Video }) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const deleteVideo = useDeleteVideo();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOwnVideo = identity && video.uploader.toString() === identity.getPrincipal().toString();
  const isVidle = video.contentType === ContentType.vidle;
  const thumbnailUrl = video.videoFile?.getDirectURL() || '/assets/generated/video-placeholder.dim_1920x1080.png';

  const handleClick = () => {
    navigate({ to: '/video/$videoId', params: { videoId: video.id.toString() } });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteVideo.mutate(video.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className="group relative aspect-video bg-muted rounded-2xl overflow-hidden cursor-pointer border-2 border-border/50 hover:border-primary/50 transition-all hover:shadow-neon"
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <video
          src={thumbnailUrl}
          poster="/assets/generated/video-placeholder.dim_1920x1080.png"
          className="w-full h-full object-cover"
        />

        {/* Vidle Badge */}
        {isVidle && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-accent text-accent-foreground font-bold uppercase text-xs px-2 py-1 rounded-full">
              VIDLE
            </Badge>
          </div>
        )}

        {/* Delete Button */}
        {isOwnVideo && (
          <button
            onClick={handleDeleteClick}
            disabled={deleteVideo.isPending}
            className="absolute top-2 right-2 z-10 bg-destructive/90 hover:bg-destructive text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="Delete video"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-primary rounded-full p-4">
            <Play className="h-8 w-8 text-primary-foreground fill-current" />
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-white font-semibold line-clamp-2 text-sm">
            {video.title || 'Untitled Video'}
          </h3>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {isVidle ? 'Vidle' : 'Video'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {isVidle ? 'vidle' : 'video'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
