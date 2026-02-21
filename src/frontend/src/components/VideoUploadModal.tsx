import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Upload, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUploadVideo } from '../hooks/useQueries';
import { toast } from 'sonner';
import { ExternalBlob, ContentType } from '../backend';

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
  const [contentType, setContentType] = useState<'video' | 'vidle'>('video');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<{ duration: number; aspectRatio: number } | null>(null);
  const uploadVideo = useUploadVideo();

  const validateVideoFile = async (file: File): Promise<boolean> => {
    if (contentType === 'video') {
      // No validation needed for regular videos
      setValidationError(null);
      return true;
    }

    setIsValidating(true);
    setValidationError(null);

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        
        const duration = video.duration;
        const width = video.videoWidth;
        const height = video.videoHeight;
        const aspectRatio = width / height;
        const targetAspectRatio = 9 / 16;
        const tolerance = 0.05;

        // Validate duration (5 seconds to 2:30 minutes)
        if (duration < 5) {
          setValidationError('Vidle duration must be at least 5 seconds');
          setIsValidating(false);
          resolve(false);
          return;
        }

        if (duration > 150) {
          setValidationError('Vidle duration cannot exceed 2 minutes 30 seconds');
          setIsValidating(false);
          resolve(false);
          return;
        }

        // Validate aspect ratio (9:16 with 5% tolerance)
        if (aspectRatio < targetAspectRatio - tolerance || aspectRatio > targetAspectRatio + tolerance) {
          setValidationError(`Vidle must have a 9:16 vertical aspect ratio (current: ${width}x${height})`);
          setIsValidating(false);
          resolve(false);
          return;
        }

        // Store metadata for upload
        setVideoMetadata({ duration, aspectRatio });
        setValidationError(null);
        setIsValidating(false);
        resolve(true);
      };

      video.onerror = () => {
        setValidationError('Failed to load video file');
        setIsValidating(false);
        resolve(false);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      setVideoFile(file);
      setVideoMetadata(null);
      
      // Validate immediately if Vidle is selected
      if (contentType === 'vidle') {
        await validateVideoFile(file);
      }
    }
  };

  const handleContentTypeChange = async (value: string) => {
    setContentType(value as 'video' | 'vidle');
    setValidationError(null);
    
    // Re-validate if file is already selected and switching to Vidle
    if (value === 'vidle' && videoFile) {
      await validateVideoFile(videoFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !videoFile) {
      toast.error('Please provide a title and video file');
      return;
    }

    // Validate Vidle requirements before upload
    if (contentType === 'vidle') {
      const isValid = await validateVideoFile(videoFile);
      if (!isValid) {
        return;
      }
    }

    try {
      const videoBytes = new Uint8Array(await videoFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(videoBytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      // Get metadata for regular videos too
      let metadata = videoMetadata;
      if (!metadata) {
        // Extract metadata if not already done
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            metadata = {
              duration: video.duration,
              aspectRatio: video.videoWidth / video.videoHeight
            };
            window.URL.revokeObjectURL(video.src);
            resolve();
          };
          video.src = URL.createObjectURL(videoFile);
        });
      }

      await uploadVideo.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        tags: tagArray,
        videoFile: blob,
        contentType: contentType === 'vidle' ? ContentType.vidle : ContentType.video,
        durationSeconds: BigInt(Math.floor(metadata?.duration || 0)),
        aspectRatio: metadata?.aspectRatio || 0
      });

      toast.success(`${contentType === 'vidle' ? 'Vidle' : 'Video'} uploaded successfully!`);
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setTags('');
      setVideoFile(null);
      setUploadProgress(0);
      setContentType('video');
      setValidationError(null);
      setVideoMetadata(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${contentType === 'vidle' ? 'vidle' : 'video'}`);
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
      setContentType('video');
      setValidationError(null);
      setVideoMetadata(null);
    }
  };

  const canUpload = !uploadVideo.isPending && 
                    !isValidating && 
                    title.trim() && 
                    videoFile && 
                    (contentType === 'video' || !validationError);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient">Upload Content</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Content Type Selection */}
          <div className="space-y-2">
            <Label>Content Type *</Label>
            <RadioGroup value={contentType} onValueChange={handleContentTypeChange} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="type-video" />
                <Label htmlFor="type-video" className="cursor-pointer font-normal">
                  Video
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vidle" id="type-vidle" />
                <Label htmlFor="type-vidle" className="cursor-pointer font-normal">
                  Vidle (Short)
                </Label>
              </div>
            </RadioGroup>
            {contentType === 'vidle' && (
              <p className="text-xs text-muted-foreground">
                Vidles must be 9:16 vertical format, 5 seconds to 2:30 minutes long
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-file">Video File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploadVideo.isPending || isValidating}
                className="rounded-xl"
              />
              {videoFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setVideoFile(null);
                    setValidationError(null);
                    setVideoMetadata(null);
                  }}
                  disabled={uploadVideo.isPending || isValidating}
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
            {isValidating && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Validating video...
              </p>
            )}
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
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
              disabled={!canUpload}
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
