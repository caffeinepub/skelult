# Specification

## Summary
**Goal:** Add SkelMsg real-time messaging feature to SkelUlt for sharing video links between users.

**Planned changes:**
- Add SkelMsg navigation option in the main header alongside existing navigation items
- Implement backend message storage with sender, recipient, content, optional video link, and timestamp
- Create conversation list view showing all message threads with preview and timestamps
- Build chat thread view displaying full message history between users in WhatsApp-style layout
- Add message input component with text field, send button, and video link attachment capability
- Implement automatic message polling every 3 seconds using React Query's refetchInterval
- Add backend query function to retrieve all conversation partners for a user

**User-visible outcome:** Users can access SkelMsg from the main navigation to send and receive text messages with video links to other SkelUlt users, view conversation lists, and see message threads that update automatically every 3 seconds in a WhatsApp-like interface.
