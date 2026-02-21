import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useFollowUser, useUnfollowUser } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { UserId } from '../backend';

interface FollowButtonProps {
  userId: UserId;
  isFollowing?: boolean;
}

export default function FollowButton({ userId, isFollowing: initialIsFollowing = false }: FollowButtonProps) {
  const { identity } = useInternetIdentity();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const isAuthenticated = !!identity;
  const isOwnProfile = identity?.getPrincipal().toString() === userId.toString();

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to follow users');
      return;
    }

    if (isOwnProfile) {
      toast.error('You cannot follow yourself');
      return;
    }

    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      if (isFollowing) {
        await unfollowUser.mutateAsync(userId);
        toast.success('Unfollowed successfully');
      } else {
        await followUser.mutateAsync(userId);
        toast.success('Following successfully');
      }
    } catch (error: any) {
      setIsFollowing(previousState);
      
      if (error.message?.includes('Already following')) {
        toast.info('You are already following this user');
      } else if (error.message?.includes('Cannot follow yourself')) {
        toast.error('You cannot follow yourself');
      } else {
        toast.error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
      }
    }
  };

  if (isOwnProfile) {
    return null;
  }

  const isPending = followUser.isPending || unfollowUser.isPending;

  return (
    <Button
      onClick={handleFollow}
      disabled={!isAuthenticated || isPending}
      variant={isFollowing ? 'outline' : 'default'}
      className={`rounded-full font-semibold ${
        isFollowing 
          ? 'border-2 border-primary text-primary hover:bg-primary/10' 
          : 'bg-primary hover:bg-primary/90 neon-glow'
      }`}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </>
      ) : isFollowing ? (
        <>
          <UserCheck className="mr-2 h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
}

