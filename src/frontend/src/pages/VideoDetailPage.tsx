import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetVideo, useGetUserProfile } from '../hooks/useQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import LikeButton from '../components/LikeButton';
import ShareButton from '../components/ShareButton';
import CommentSection from '../components/CommentSection';
import CommentInput from '../components/CommentInput';

export default function VideoDetailPage() {
  const { videoId } = useParams({ from: '/video/$videoId' });
  const navigate = useNavigate();
  const { data: video, isLoading: videoLoading, isError: videoError } = useGetVideo(videoId);
  const { data: uploaderProfile } = useGetUserProfile(video?.uploader.toString() || '');

  useEffect(() => {
    console.log('VideoDetailPage mounted with videoId:', videoId);
  }, [videoId]);

  console.log('VideoDetailPage rendering', { videoId, videoLoading, videoError, video });

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

  if (videoError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Error Loading Video</h2>
          <p className="text-muted-foreground">There was an error loading this video</p>
          <Button onClick={() => navigate({ to: '/' })} className="rounded-full">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Video Not Found</h2>
          <p className="text-muted-foreground">This video doesn't exist or has been removed</p>
          <Button onClick={() => navigate({ to: '/' })} className="rounded-full">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const videoUrl = video.videoFile?.getDirectURL() || '';
  const uploadDate = new Date(Number(video.uploadTime) / 1000000);

  const handleProfileClick = () => {
    navigate({ to: '/profile/$userId', params: { userId: video.uploader.toString() } });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/' })}
        className="rounded-full"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Feed
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border-2 border-border/50">
            <video
              src={videoUrl}
              poster="/assets/generated/video-placeholder.dim_1920x1080.png"
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{video.title || 'Untitled Video'}</h1>
              {video.description && (
                <p className="text-muted-foreground">{video.description}</p>
              )}
            </div>

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="rounded-full">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 py-4 border-y border-border/50">
              <LikeButton videoId={video.id} initialLikes={Number(video.likes || 0)} />
              <ShareButton videoId={video.id} />
              <span className="text-sm text-muted-foreground ml-auto">
                {formatDistanceToNow(uploadDate, { addSuffix: true })}
              </span>
            </div>

            {/* Uploader Info */}
            <div 
              className="flex items-center gap-3 p-4 bg-muted rounded-2xl cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={handleProfileClick}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={uploaderProfile?.profilePicture?.getDirectURL()} />
                <AvatarFallback className="bg-gradient-neon text-white">
                  {uploaderProfile?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{uploaderProfile?.username || 'Unknown User'}</p>
                {uploaderProfile?.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{uploaderProfile.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="lg:col-span-1 space-y-4">
          <CommentInput videoId={video.id} />
          <CommentSection videoId={video.id} />
        </div>
      </div>
    </div>
  );
}
