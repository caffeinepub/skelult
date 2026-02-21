import { formatDistanceToNow } from 'date-fns';
import { Link } from '@tanstack/react-router';
import { ExternalLink } from 'lucide-react';
import type { Message } from '../backend';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const timestamp = new Date(Number(message.timestamp) / 1000000);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>
        
        {message.videoLink && (
          <Link
            to="/video/$videoId"
            params={{ videoId: message.videoLink }}
            className={`flex items-center gap-2 mt-2 text-xs underline ${
              isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'
            } hover:opacity-80 transition-opacity`}
          >
            <ExternalLink className="h-3 w-3" />
            View Video
          </Link>
        )}
        
        <p
          className={`text-xs mt-1 ${
            isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
          }`}
        >
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
