import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetUserProfile, useGetUserVideos } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings } from 'lucide-react';
import VideoGrid from '../components/VideoGrid';
import FollowButton from '../components/FollowButton';
import EditProfileModal from '../components/EditProfileModal';
import { useState } from 'react';
import { Principal } from '@dfinity/principal';

export default function ProfilePage() {
  const { userId } = useParams({ from: '/profile/$userId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetUserProfile(userId);
  const { data: videos, isLoading: videosLoading, isError: videosError } = useGetUserVideos(userId);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    console.log('ProfilePage mounted with userId:', userId);
  }, [userId]);

  console.log('ProfilePage rendering', { userId, profileLoading, profileError, profile });

  const isOwnProfile = identity && userId === identity.getPrincipal().toString();

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Error Loading Profile</h2>
          <p className="text-muted-foreground">There was an error loading this profile</p>
          <Button onClick={() => navigate({ to: '/' })} className="rounded-full">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Profile Not Found</h2>
          <p className="text-muted-foreground">This user hasn't set up their profile yet</p>
          <Button onClick={() => navigate({ to: '/' })} className="rounded-full">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="bg-card border-2 border-border/50 rounded-3xl p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-32 w-32 border-4 border-primary/50">
              <AvatarImage src={profile.profilePicture?.getDirectURL()} />
              <AvatarFallback className="bg-gradient-neon text-white text-4xl">
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <h1 className="text-3xl font-bold text-gradient">{profile.username || 'Unknown User'}</h1>
                {isOwnProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    className="rounded-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <FollowButton userId={Principal.fromText(userId)} />
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}

              <div className="flex gap-4 justify-center sm:justify-start">
                <div className="text-center">
                  <p className="text-2xl font-bold">{Number(profile.followers || 0)}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{Number(profile.following || 0)}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{videos?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Videos</h2>
            <Badge variant="secondary" className="rounded-full">
              {videos?.length || 0} videos
            </Badge>
          </div>

          {videosLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : videosError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Failed to load videos</p>
            </div>
          ) : (
            <VideoGrid videos={videos || []} />
          )}
        </div>
      </div>

      {isOwnProfile && profile && (
        <EditProfileModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          currentProfile={profile}
        />
      )}
    </>
  );
}
