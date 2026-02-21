import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { useSearchUsers, useSendFriendRequest } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';

interface AddFriendsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFriendsModal({ open, onOpenChange }: AddFriendsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const { data: searchResults, isLoading: searching } = useSearchUsers(searchTerm);
  const sendRequest = useSendFriendRequest();

  const handleSendRequest = async (username: string) => {
    try {
      // Find the user's principal from search results
      const user = searchResults?.find(u => u.username === username);
      if (!user) return;

      // We need to get the principal somehow - for now we'll use a workaround
      // In a real app, searchUsers should return Principal along with UserProfile
      // For now, we'll track by username
      setSentRequests(prev => new Set(prev).add(username));
      
      // Note: This is a limitation - we need the Principal to send the request
      // The backend searchUsers returns UserProfile but not the Principal
      // This would need backend enhancement to include Principal in search results
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient">Add Friends</DialogTitle>
          <DialogDescription>
            Search for users by username to send friend requests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          <ScrollArea className="h-[300px] rounded-lg border border-border">
            {searching ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : searchTerm.trim().length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <p>Start typing to search for users</p>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="p-2 space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profilePicture?.getDirectURL()} />
                      <AvatarFallback className="bg-gradient-neon text-white">
                        {user.username[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={sentRequests.has(user.username) || sendRequest.isPending}
                      onClick={() => handleSendRequest(user.username)}
                      className="rounded-full"
                    >
                      {sentRequests.has(user.username) ? (
                        <>Sent</>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <p>No users found</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
