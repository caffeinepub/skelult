import { useGetMostLikedVideos, useGetCallerUserProfile, useGetVideoComments } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import VideoCard from '../components/VideoCard';
import ProfileSetupModal from '../components/ProfileSetupModal';
import { Loader2, Video } from 'lucide-react';

export default function FeedPage() {
  const { identity } = useInternetIdentity();
  const { data: videos, isLoading: videosLoading } = useGetMostLikedVideos();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (videosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-6">
          <h1 className="text-4xl font-bold text-gradient">Discover Videos</h1>
          <p className="text-muted-foreground">
            Watch the most popular videos from our community
          </p>
        </div>

        {/* Video Feed */}
        {videos && videos.length > 0 ? (
          <div className="space-y-6">
            {videos.map((video) => (
              <VideoCard 
                key={video.id.toString()} 
                video={video}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="bg-muted rounded-full p-6">
                <Video className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No videos yet</h3>
              <p className="text-muted-foreground">
                Be the first to upload a video to SkelUlt!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Setup Modal */}
      {showProfileSetup && <ProfileSetupModal open={showProfileSetup} />}
    </>
  );
}

