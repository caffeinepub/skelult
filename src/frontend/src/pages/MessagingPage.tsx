import { useEffect, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import ConversationList from '../components/ConversationList';
import ChatThread from '../components/ChatThread';
import FriendRequestsList from '../components/FriendRequestsList';
import FriendsList from '../components/FriendsList';
import AddFriendsModal from '../components/AddFriendsModal';
import type { Principal } from '@dfinity/principal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, MessageSquare } from 'lucide-react';
import { useGetFriendRequests } from '../hooks/useQueries';
import { Badge } from '@/components/ui/badge';

export default function MessagingPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<Principal | null>(null);
  const [showAddFriends, setShowAddFriends] = useState(false);
  const { data: friendRequests } = useGetFriendRequests();

  useEffect(() => {
    console.log('MessagingPage mounted', { isAuthenticated: !!identity });
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  console.log('MessagingPage rendering', { isAuthenticated: !!identity });

  if (!identity) {
    return null;
  }

  const pendingRequestsCount = friendRequests?.length || 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">SkelMsg</h1>
          <p className="text-muted-foreground">Real-time messaging for SkelUlt</p>
        </div>
        <Button
          onClick={() => setShowAddFriends(true)}
          className="rounded-full bg-primary hover:bg-primary/90 neon-glow"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friends
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-16rem)]">
        {/* Left Panel - Conversations & Friends */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="conversations" className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conversations" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chats
                </TabsTrigger>
                <TabsTrigger value="friends" className="gap-2">
                  <Users className="h-4 w-4" />
                  Friends
                  {pendingRequestsCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {pendingRequestsCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="conversations" className="flex-1 overflow-hidden m-0">
              <ConversationList 
                selectedUser={selectedUser} 
                onSelectUser={setSelectedUser} 
              />
            </TabsContent>

            <TabsContent value="friends" className="flex-1 overflow-hidden m-0 p-4">
              <div className="space-y-6">
                {pendingRequestsCount > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      Friend Requests
                      <Badge variant="secondary">{pendingRequestsCount}</Badge>
                    </h3>
                    <FriendRequestsList />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-3">Your Friends</h3>
                  <FriendsList />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Right Panel - Chat Thread */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          {selectedUser ? (
            <ChatThread recipientId={selectedUser} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <AddFriendsModal open={showAddFriends} onOpenChange={setShowAddFriends} />
    </div>
  );
}
