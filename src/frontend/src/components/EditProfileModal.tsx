import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload } from 'lucide-react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { toast } from 'sonner';
import { ExternalBlob, type UserProfile } from '../backend';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: UserProfile;
}

export default function EditProfileModal({ open, onOpenChange, currentProfile }: EditProfileModalProps) {
  const [username, setUsername] = useState(currentProfile.username);
  const [bio, setBio] = useState(currentProfile.bio);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    currentProfile.profilePicture?.getDirectURL()
  );
  const saveProfile = useSaveCallerUserProfile();

  useEffect(() => {
    setUsername(currentProfile.username);
    setBio(currentProfile.bio);
    setPreviewUrl(currentProfile.profilePicture?.getDirectURL());
  }, [currentProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      setProfilePicFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    try {
      let profilePicture = currentProfile.profilePicture;
      
      if (profilePicFile) {
        const imageBytes = new Uint8Array(await profilePicFile.arrayBuffer());
        profilePicture = ExternalBlob.fromBytes(imageBytes);
      }

      await saveProfile.mutateAsync({
        username: username.trim(),
        bio: bio.trim(),
        profilePicture,
        followers: currentProfile.followers,
        following: currentProfile.following
      });

      toast.success('Profile updated successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient">Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-primary/50">
              <AvatarImage src={previewUrl} />
              <AvatarFallback className="bg-gradient-neon text-white text-2xl">
                {username[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <Label htmlFor="profile-pic" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                <Upload className="h-4 w-4" />
                Change Profile Picture
              </div>
              <Input
                id="profile-pic"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-username">Username *</Label>
            <Input
              id="edit-username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={saveProfile.isPending}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea
              id="edit-bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saveProfile.isPending}
              className="rounded-xl min-h-[100px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveProfile.isPending}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveProfile.isPending || !username.trim()}
              className="flex-1 rounded-xl bg-primary hover:bg-primary/90 neon-glow"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

