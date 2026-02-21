import { useNavigate } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import type { Video } from '../backend';

interface VideoGridProps {
  videos: Video[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  const navigate = useNavigate();

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No videos yet</p>
      </div>
    );
  }

  return (
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
  );
}

