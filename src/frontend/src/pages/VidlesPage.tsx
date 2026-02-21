import { useEffect } from 'react';
import { useGetVidles, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, Film, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGetUserProfile } from '../hooks/useQueries';
import { formatDistanceToNow } from 'date-fns';
import LikeButton from '../components/LikeButton';
import ShareButton from '../components/ShareButton';
import ProfileSetupModal from '../components/ProfileSetupModal';

export default function VidlesPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: vidles, isLoading: vidlesLoading, isError: vidlesError } = useGetVidles();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  
  useEffect(() => {
    console.log('VidlesPage mounted');
  }, []);

  console.log('VidlesPage rendering', { vidlesLoading, vidlesError, vidlesCount: vidles?.length });

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (vidlesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading vidles...</p>
        </div>
      </div>
    );
  }

  if (vidlesError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-destructive/10 rounded-full p-6">
              <Film className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Failed to load vidles</h3>
            <p className="text-muted-foreground">
              There was an error loading vidles. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!vidles || vidles.length === 0) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="bg-muted rounded-full p-8">
                <Film className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gradient">No Vidles Yet</h2>
              <p className="text-muted-foreground">
                Be the first to share a short-form vertical video! Vidles are 9:16 format videos between 5 seconds and 2:30 minutes.
              </p>
            </div>
            {isAuthenticated && (
              <Button
                onClick={() => navigate({ to: '/' })}
                className="rounded-full bg-primary hover:bg-primary/90 neon-glow"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Vidle
              </Button>
            )}
          </div>
        </div>
        {showProfileSetup && <ProfileSetupModal open={showProfileSetup} />}
      </>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-6">
          <h1 className="text-4xl font-bold text-gradient flex items-center justify-center gap-3">
            <Film className="h-10 w-10" />
            Vidles
          </h1>
          <p className="text-muted-foreground">
            Short-form vertical videos from our community
          </p>
        </div>

        {/* Vidles Feed */}
        <div className="space-y-8">
          {vidles.map((vidle) => (
            <VidleCard key={vidle.id.toString()} vidle={vidle} />
          ))}
        </div>
      </div>

      {showProfileSetup && <ProfileSetupModal open={showProfileSetup} />}
    </>
  );
}

function VidleCard({ vidle }: { vidle: any }) {
  const navigate = useNavigate();
  const { data: uploaderProfile } = useGetUserProfile(vidle.uploader.toString());
  const uploadDate = new Date(Number(vidle.uploadTime) / 1000000);

  const handleProfileClick = () => {
    navigate({ to: '/profile/$userId', params: { userId: vidle.uploader.toString() } });
  };

  const handleVideoClick = () => {
    navigate({ to: '/video/$videoId', params: { videoId: vidle.id.toString() } });
  };

  return (
    <div className="bg-card border-2 border-border/50 rounded-3xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-neon">
      {/* Video Player - Reduced by 40% */}
      <div 
        className="relative bg-muted mx-auto cursor-pointer"
        style={{ maxWidth: '270px', aspectRatio: '9/16' }}
        onClick={handleVideoClick}
      >
        <video
          src={vidle.videoFile?.getDirectURL() || ''}
          poster="/assets/generated/video-placeholder.dim_1920x1080.png"
          controls
          className="w-full h-full object-cover"
        />
        {/* Vidle Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-accent text-accent-foreground font-bold uppercase text-xs px-3 py-1 rounded-full neon-glow">
            VIDLE
          </Badge>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-6 space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <Avatar 
            className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
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
          <h3 className="font-bold text-xl line-clamp-2 mb-1">{vidle.title || 'Untitled Vidle'}</h3>
          {vidle.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{vidle.description}</p>
          )}
        </div>

        {/* Tags */}
        {vidle.tags && vidle.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {vidle.tags.slice(0, 5).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="rounded-full text-xs">
                #{tag}
              </Badge>
            ))}
            {vidle.tags.length > 5 && (
              <Badge variant="secondary" className="rounded-full text-xs">
                +{vidle.tags.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          <LikeButton videoId={vidle.id} initialLikes={Number(vidle.likes || 0)} />
          <ShareButton videoId={vidle.id} />
        </div>
      </div>
    </div>
  );
}
