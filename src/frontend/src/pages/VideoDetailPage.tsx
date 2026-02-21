import { useParams, useNavigate } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useGetVideo, useGetUserProfile, useGetVideoComments } from '../hooks/useQueries';
import LikeButton from '../components/LikeButton';
import ShareButton from '../components/ShareButton';
import CommentSection from '../components/CommentSection';
import CommentInput from '../components/CommentInput';
import { formatDistanceToNow } from 'date-fns';

export default function VideoDetailPage() {
  const { videoId } = useParams({ from: '/video/$videoId' });
  const navigate = useNavigate();
  const { data: video, isLoading: videoLoading } = useGetVideo(BigInt(videoId));
  const { data: uploaderProfile } = useGetUserProfile(video?.uploader.toString() || '');
  const { data: comments } = useGetVideoComments(BigInt(videoId));

  if (videoLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-2xl font-bold">Video not found</h2>
        <p className="text-muted-foreground">This video doesn't exist or has been removed.</p>
        <Button onClick={() => navigate({ to: '/' })} className="rounded-xl">
          Back to Feed
        </Button>
      </div>
    );
  }

  const videoUrl = video.videoFile.getDirectURL();
  const uploadDate = new Date(Number(video.uploadTime) / 1000000);

  const handleProfileClick = () => {
    navigate({ to: '/profile/$userId', params: { userId: video.uploader.toString() } });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/' })}
        className="rounded-xl"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Feed
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Player & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="relative aspect-video bg-muted rounded-3xl overflow-hidden border-2 border-border/50 shadow-neon">
            <video
              src={videoUrl}
              poster="/assets/generated/video-placeholder.dim_1920x1080.png"
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>

          {/* Video Info */}
          <div className="bg-card rounded-3xl border-2 border-border/50 p-6 space-y-4">
            <h1 className="text-3xl font-bold">{video.title}</h1>

            {/* User Info */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleProfileClick}
              >
                <Avatar className="h-12 w-12 border-2 border-primary/50">
                  <AvatarImage src={uploaderProfile?.profilePicture?.getDirectURL()} />
                  <AvatarFallback className="bg-gradient-neon text-white">
                    {uploaderProfile?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{uploaderProfile?.username || 'Unknown User'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(uploadDate, { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <LikeButton videoId={video.id} initialLikes={Number(video.likes)} />
                <ShareButton videoId={video.id} />
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-foreground whitespace-pre-wrap">{video.description}</p>
              </div>
            )}

            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {video.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="rounded-full">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-3xl border-2 border-border/50 p-6 space-y-6">
            <CommentInput videoId={video.id} />
            <CommentSection videoId={video.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

