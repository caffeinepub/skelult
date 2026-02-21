import { useState } from 'react';
import { useSendMessage } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import type { Principal } from '@dfinity/principal';
import VideoLinkPicker from './VideoLinkPicker';

interface MessageInputProps {
  recipientId: Principal;
}

export default function MessageInput({ recipientId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [videoLink, setVideoLink] = useState<string | undefined>(undefined);
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const sendMessage = useSendMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !videoLink) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      await sendMessage.mutateAsync({
        recipient: recipientId,
        content: message.trim() || 'Shared a video',
        videoLink,
      });
      setMessage('');
      setVideoLink(undefined);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  };

  const handleVideoSelect = (videoId: string) => {
    setVideoLink(`/video/${videoId}`);
    setShowVideoPicker(false);
    toast.success('Video attached to message');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-2">
        {videoLink && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
            <Video className="h-4 w-4" />
            <span className="flex-1 truncate">Video attached</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setVideoLink(undefined)}
              className="h-6 px-2"
            >
              Remove
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sendMessage.isPending}
            className="rounded-xl resize-none"
            rows={2}
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowVideoPicker(true)}
              disabled={sendMessage.isPending}
              className="rounded-xl"
              title="Attach video"
            >
              <Video className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              disabled={sendMessage.isPending || (!message.trim() && !videoLink)}
              className="rounded-xl bg-primary hover:bg-primary/90"
              size="icon"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </form>

      <VideoLinkPicker
        open={showVideoPicker}
        onOpenChange={setShowVideoPicker}
        onSelectVideo={handleVideoSelect}
      />
    </>
  );
}
