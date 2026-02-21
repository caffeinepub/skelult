import { useParams, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Users, Video as VideoIcon } from 'lucide-react';
import { useGetUserProfile, useGetUserVideos } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import VideoGrid from '../components/VideoGrid';
import FollowButton from '../components/FollowButton';
import EditProfileModal from '../components/EditProfileModal';
import { Principal } from '@dfinity/principal';

export default function ProfilePage() {
  const { userId } = useParams({ from: '/profile/$userId' });
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(userId);
  const { data: videos, isLoading: videosLoading } = useGetUserVideos(Principal.fromText(userId));

  const isOwnProfile = identity?.getPrincipal().toString() === userId;

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

  if (!profile) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-2xl font-bold">Profile not found</h2>
        <p className="text-muted-foreground">This user hasn't set up their profile yet.</p>
        <Button onClick={() => navigate({ to: '/' })} className="rounded-xl">
          Back to Feed
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-card rounded-3xl border-2 border-border/50 p-8 shadow-neon">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar */}
          <Avatar className="h-32 w-32 border-4 border-primary/50 shadow-neon">
            <AvatarImage src={profile.profilePicture?.getDirectURL()} />
            <AvatarFallback className="bg-gradient-neon text-white text-4xl">
              {profile.username[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{profile.username}</h1>
                {isOwnProfile ? (
                  <Button
                    onClick={() => setEditModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-2 border-primary"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <FollowButton userId={Principal.fromText(userId)} />
                )}
              </div>
              {profile.bio && (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-4 py-2">
                  <VideoIcon className="mr-2 h-4 w-4" />
                  {videos?.length || 0} Videos
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-4 py-2">
                  <Users className="mr-2 h-4 w-4" />
                  {Number(profile.followers)} Followers
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-4 py-2">
                  <Users className="mr-2 h-4 w-4" />
                  {Number(profile.following)} Following
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Videos</h2>
        {videosLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <VideoGrid videos={videos || []} />
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && profile && (
        <EditProfileModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          currentProfile={profile}
        />
      )}
    </div>
  );
}

