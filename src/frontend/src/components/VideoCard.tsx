import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { Video } from '../backend';
import LikeButton from './LikeButton';
import ShareButton from './ShareButton';
import { useGetUserProfile } from '../hooks/useQueries';
import { formatDistanceToNow } from 'date-fns';

interface VideoCardProps {
  video: Video;
  commentCount?: number;
}

export default function VideoCard({ video, commentCount = 0 }: VideoCardProps) {
  const navigate = useNavigate();
  const { data: uploaderProfile } = useGetUserProfile(video.uploader.toString());
  const [isPlaying, setIsPlaying] = useState(false);

  const videoUrl = video.videoFile.getDirectURL();
  const uploadDate = new Date(Number(video.uploadTime) / 1000000);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('video')) {
      return;
    }
    navigate({ to: '/video/$videoId', params: { videoId: video.id.toString() } });
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: '/profile/$userId', params: { userId: video.uploader.toString() } });
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-neon transition-all duration-300 cursor-pointer border-2 border-border/50 hover:border-primary/50"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Video Player */}
        <div className="relative aspect-video bg-muted">
          <video
            src={videoUrl}
            poster="/assets/generated/video-placeholder.dim_1920x1080.png"
            controls
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>

        {/* Video Info */}
        <div className="p-4 space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar 
              className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={handleProfileClick}
            >
              <AvatarImage src={uploaderProfile?.profilePicture?.getDirectURL()} />
              <AvatarFallback className="bg-gradient-neon text-white">
                {uploaderProfile?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p 
                className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                onClick={handleProfileClick}
              >
                {uploaderProfile?.username || 'Unknown User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(uploadDate, { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="font-bold text-lg line-clamp-2 mb-1">{video.title}</h3>
            {video.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
            )}
          </div>

          {/* Tags */}
          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {video.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="rounded-full text-xs">
                  #{tag}
                </Badge>
              ))}
              {video.tags.length > 3 && (
                <Badge variant="secondary" className="rounded-full text-xs">
                  +{video.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-border/50">
            <LikeButton videoId={video.id} initialLikes={Number(video.likes)} />
            
            <button 
              className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: '/video/$videoId', params: { videoId: video.id.toString() } });
              }}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{commentCount}</span>
            </button>

            <ShareButton videoId={video.id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

