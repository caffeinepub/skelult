import { useGetFriendRequests, useAcceptFriendRequest, useDeclineFriendRequest, useGetUserProfile } from '../hooks/useQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, Inbox } from 'lucide-react';
import type { Principal } from '@dfinity/principal';

export default function FriendRequestsList() {
  const { data: requests, isLoading } = useGetFriendRequests();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 border-primary/20">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No pending friend requests</p>
        <p className="text-xs mt-1">New requests will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <FriendRequestItem
          key={request.sender.toString()}
          senderId={request.sender}
          onAccept={() => acceptRequest.mutate(request.sender)}
          onDecline={() => declineRequest.mutate(request.sender)}
          isAccepting={acceptRequest.isPending}
          isDeclining={declineRequest.isPending}
        />
      ))}
    </div>
  );
}

interface FriendRequestItemProps {
  senderId: Principal;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting: boolean;
  isDeclining: boolean;
}

function FriendRequestItem({ senderId, onAccept, onDecline, isAccepting, isDeclining }: FriendRequestItemProps) {
  const { data: profile } = useGetUserProfile(senderId.toString());

  return (
    <Card className="p-4 border-primary/30 hover:border-primary/60 transition-all duration-200 hover:shadow-neon-sm bg-card/50">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarImage src={profile?.profilePicture?.getDirectURL()} />
          <AvatarFallback className="bg-gradient-neon text-white font-semibold">
            {profile?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-foreground">{profile?.username || 'Loading...'}</p>
          <p className="text-xs text-muted-foreground">wants to be friends</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onAccept}
            disabled={isAccepting || isDeclining}
            className="rounded-full bg-primary hover:bg-primary/90 neon-glow h-9 w-9 p-0"
            title="Accept friend request"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDecline}
            disabled={isAccepting || isDeclining}
            className="rounded-full border-destructive/50 hover:bg-destructive/10 hover:border-destructive h-9 w-9 p-0"
            title="Decline friend request"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
