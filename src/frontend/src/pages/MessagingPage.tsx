import { useEffect, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import ConversationList from '../components/ConversationList';
import ChatThread from '../components/ChatThread';
import type { Principal } from '@dfinity/principal';
import { Card } from '@/components/ui/card';

export default function MessagingPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<Principal | null>(null);

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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gradient mb-2">SkelMsg</h1>
        <p className="text-muted-foreground">Real-time messaging for SkelUlt</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-16rem)]">
        {/* Conversation List */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <ConversationList 
            selectedUser={selectedUser} 
            onSelectUser={setSelectedUser} 
          />
        </Card>

        {/* Chat Thread */}
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
    </div>
  );
}
