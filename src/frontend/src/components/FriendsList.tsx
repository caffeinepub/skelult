import { useState } from 'react';
import { useGetFriendsList, useUnfriend, useGetUserProfile } from '../hooks/useQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { UserMinus } from 'lucide-react';
import type { Principal } from '@dfinity/principal';

export default function FriendsList() {
  const { data: friends, isLoading } = useGetFriendsList();
  const [unfriendTarget, setUnfriendTarget] = useState<Principal | null>(null);
  const unfriendMutation = useUnfriend();

  const handleUnfriend = () => {
    if (unfriendTarget) {
      unfriendMutation.mutate(unfriendTarget);
      setUnfriendTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No friends yet</p>
        <p className="text-sm mt-1">Start adding friends to connect!</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-4">
          {friends.map((friend) => (
            <FriendItem
              key={friend.toString()}
              friendId={friend}
              onUnfriend={() => setUnfriendTarget(friend)}
            />
          ))}
        </div>
      </ScrollArea>

      <AlertDialog open={!!unfriendTarget} onOpenChange={(open) => !open && setUnfriendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? You can always send them a friend request again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnfriend} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface FriendItemProps {
  friendId: Principal;
  onUnfriend: () => void;
}

function FriendItem({ friendId, onUnfriend }: FriendItemProps) {
  const { data: profile } = useGetUserProfile(friendId.toString());

  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.profilePicture?.getDirectURL()} />
          <AvatarFallback className="bg-gradient-neon text-white">
            {profile?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{profile?.username || 'Loading...'}</p>
          {profile?.bio && (
            <p className="text-xs text-muted-foreground truncate">{profile.bio}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onUnfriend}
          className="rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
        >
          <UserMinus className="h-4 w-4 mr-1" />
          Unfriend
        </Button>
      </div>
    </Card>
  );
}
