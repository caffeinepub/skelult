import { useEffect, useRef } from 'react';
import { useGetMessagesWith, useGetUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import type { Principal } from '@dfinity/principal';

interface ChatThreadProps {
  recipientId: Principal;
}

export default function ChatThread({ recipientId }: ChatThreadProps) {
  const { identity } = useInternetIdentity();
  const { data: messages, isLoading } = useGetMessagesWith(recipientId);
  const { data: recipientProfile } = useGetUserProfile(recipientId.toString());
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current && messages) {
      const shouldScroll = 
        prevMessagesLengthRef.current === 0 || 
        messages.length > prevMessagesLengthRef.current;
      
      if (shouldScroll) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  if (!identity) {
    return null;
  }

  const currentUserId = identity.getPrincipal().toString();

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={recipientProfile?.profilePicture?.getDirectURL()} 
            alt={recipientProfile?.username || 'User'} 
          />
          <AvatarFallback>
            <img src="/assets/generated/default-avatar.dim_200x200.png" alt="Avatar" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{recipientProfile?.username || 'Loading...'}</h3>
          {recipientProfile?.bio && (
            <p className="text-sm text-muted-foreground truncate">{recipientProfile.bio}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="h-16 w-64 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                isOwn={message.sender.toString() === currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <MessageInput recipientId={recipientId} />
      </div>
    </div>
  );
}
