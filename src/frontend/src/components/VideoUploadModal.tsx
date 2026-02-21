import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, X } from 'lucide-react';
import { useUploadVideo } from '../hooks/useQueries';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

interface VideoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VideoUploadModal({ open, onOpenChange }: VideoUploadModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadVideo = useUploadVideo();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !videoFile) {
      toast.error('Please provide a title and video file');
      return;
    }

    try {
      const videoBytes = new Uint8Array(await videoFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(videoBytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      await uploadVideo.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        tags: tagArray,
        videoFile: blob
      });

      toast.success('Video uploaded successfully!');
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setTags('');
      setVideoFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    }
  };

  const handleClose = () => {
    if (!uploadVideo.isPending) {
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setTags('');
      setVideoFile(null);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient">Upload Video</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="video-file">Video File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploadVideo.isPending}
                className="rounded-xl"
              />
              {videoFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setVideoFile(null)}
                  disabled={uploadVideo.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {videoFile && (
              <p className="text-sm text-muted-foreground">
                {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploadVideo.isPending}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploadVideo.isPending}
              className="rounded-xl min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., music, dance, comedy"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={uploadVideo.isPending}
              className="rounded-xl"
            />
          </div>

          {uploadVideo.isPending && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploadVideo.isPending}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadVideo.isPending || !title.trim() || !videoFile}
              className="flex-1 rounded-xl bg-primary hover:bg-primary/90 neon-glow"
            >
              {uploadVideo.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

