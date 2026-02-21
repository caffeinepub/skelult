import { useState } from 'react';
import { useSendMessage } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Video } from 'lucide-react';
import { toast } from 'sonner';
import VideoLinkPicker from './VideoLinkPicker';
import type { Principal } from '@dfinity/principal';

interface MessageInputProps {
  recipientId: Principal;
}

export default function MessageInput({ recipientId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [videoLink, setVideoLink] = useState<string | null>(null);
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const sendMessage = useSendMessage();

  const handleSend = async () => {
    if (!content.trim() && !videoLink) {
      toast.error('Please enter a message or select a video');
      return;
    }

    try {
      await sendMessage.mutateAsync({
        recipient: recipientId,
        content: content.trim() || (videoLink ? 'Shared a video' : ''),
        videoLink,
      });
      setContent('');
      setVideoLink(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-2">
      {videoLink && (
        <div className="flex items-center gap-2 p-2 bg-accent rounded-lg text-sm">
          <Video className="h-4 w-4 text-primary" />
          <span className="flex-1 truncate">Video attached</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVideoLink(null)}
            className="h-6 px-2"
          >
            Remove
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowVideoPicker(true)}
          disabled={sendMessage.isPending}
          className="shrink-0"
        >
          <Video className="h-4 w-4" />
        </Button>
        
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="resize-none min-h-[44px] max-h-32"
          rows={1}
          disabled={sendMessage.isPending}
        />
        
        <Button
          onClick={handleSend}
          disabled={sendMessage.isPending || (!content.trim() && !videoLink)}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <VideoLinkPicker
        open={showVideoPicker}
        onOpenChange={setShowVideoPicker}
        onSelectVideo={(videoId) => {
          setVideoLink(videoId);
          setShowVideoPicker(false);
        }}
      />
    </div>
  );
}
