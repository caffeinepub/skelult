# Specification

## Summary
**Goal:** Implement a friend system with user search, friend requests, and accepted friends management in SkelMsg, and reduce the Vidles video player size by 40%.

**Planned changes:**
- Add friend request data model to backend with sender, recipient, status, and timestamp
- Implement backend functions for sending, accepting, declining friend requests, getting friend requests/lists, unfriending, and searching users by username
- Create React Query hooks for all friend system operations with proper caching and optimistic updates
- Add "Add Friends" button to MessagingPage that opens a search modal
- Create AddFriendsModal component with user search, results display, and send request functionality
- Create FriendRequestsList component showing pending requests with accept/decline buttons
- Create FriendsList component displaying accepted friends with unfriend buttons
- Integrate friend requests and friends list into MessagingPage layout
- Add friend status indicators to conversations showing friend, pending, or non-friend status
- Reduce video player size in VidlesPage by 40% for better vertical video display

**User-visible outcome:** Users can search for other users, send and receive friend requests, manage their friends list, and see friend status in conversations. Vidles vertical videos display more compactly on screen.
