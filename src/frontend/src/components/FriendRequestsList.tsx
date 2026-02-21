import { useGetFriendRequests, useAcceptFriendRequest, useDeclineFriendRequest, useGetUserProfile } from '../hooks/useQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X } from 'lucide-react';
import type { Principal } from '@dfinity/principal';

export default function FriendRequestsList() {
  const { data: requests, isLoading } = useGetFriendRequests();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No pending friend requests</p>
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
          <p className="text-xs text-muted-foreground">wants to be friends</p>
        </div>
        <Button
          size="sm"
          onClick={onAccept}
          disabled={isAccepting || isDeclining}
          className="rounded-full bg-primary hover:bg-primary/90"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDecline}
          disabled={isAccepting || isDeclining}
          className="rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
