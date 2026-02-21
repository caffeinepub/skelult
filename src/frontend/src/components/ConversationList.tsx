import { useGetConversationPartners, useGetUserProfile, useGetMessagesWith } from '../hooks/useQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { Principal } from '@dfinity/principal';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  selectedUser: Principal | null;
  onSelectUser: (user: Principal) => void;
}

export default function ConversationList({ selectedUser, onSelectUser }: ConversationListProps) {
  const { data: partners, isLoading } = useGetConversationPartners();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!partners || partners.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
        <p>No conversations yet. Start chatting with other users!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Messages</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {partners.map((partner) => (
            <ConversationItem
              key={partner.toString()}
              partnerId={partner}
              isSelected={selectedUser?.toString() === partner.toString()}
              onSelect={() => onSelectUser(partner)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ConversationItemProps {
  partnerId: Principal;
  isSelected: boolean;
  onSelect: () => void;
}

function ConversationItem({ partnerId, isSelected, onSelect }: ConversationItemProps) {
  const { data: profile } = useGetUserProfile(partnerId.toString());
  const { data: messages } = useGetMessagesWith(partnerId.toString());

  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageTime = lastMessage ? new Date(Number(lastMessage.timestamp) / 1000000) : null;

  return (
    <button
      onClick={onSelect}
      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors hover:bg-accent ${
        isSelected ? 'bg-accent' : ''
      }`}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage 
          src={profile?.profilePicture?.getDirectURL()} 
          alt={profile?.username || 'User'} 
        />
        <AvatarFallback>
          <img src="/assets/generated/default-avatar.dim_200x200.png" alt="Avatar" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 text-left overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="font-semibold truncate">{profile?.username || 'Loading...'}</p>
          {lastMessageTime && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(lastMessageTime, { addSuffix: true })}
            </span>
          )}
        </div>
        {lastMessage && (
          <p className="text-sm text-muted-foreground truncate">
            {lastMessage.videoLink ? '📹 Video link' : lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
}
