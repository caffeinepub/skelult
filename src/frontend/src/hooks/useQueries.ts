import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Video, Comment, Message, VideoId } from '../backend';
import { ExternalBlob, ContentType } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        console.error('Error fetching caller profile:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getUserProfile(Principal.fromText(userId));
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!userId,
    retry: 1,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.saveCallerUserProfile(profile);
      } catch (error) {
        console.error('Error saving profile:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Video Queries
export function useGetMostLikedVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos', 'mostLiked'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMostLikedVideos();
      } catch (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useGetVidles() {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos', 'vidles'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const allVideos = await actor.getMostLikedVideos();
        return allVideos.filter(video => video.contentType === ContentType.vidle);
      } catch (error) {
        console.error('Error fetching vidles:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useGetUserVideos(userId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['videos', 'user', userId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getUserVideos(Principal.fromText(userId));
      } catch (error) {
        console.error('Error fetching user videos:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!userId,
    retry: 1,
  });
}

export function useGetVideo(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Video | null>({
    queryKey: ['video', videoId],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getVideo(BigInt(videoId));
      } catch (error) {
        console.error('Error fetching video:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!videoId,
    retry: 1,
  });
}

export function useUploadVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      tags,
      videoFile,
      contentType,
      durationSeconds,
      aspectRatio,
    }: {
      title: string;
      description: string;
      tags: string[];
      videoFile: ExternalBlob;
      contentType?: ContentType;
      durationSeconds?: bigint;
      aspectRatio?: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.uploadVideo(
          title,
          description,
          tags,
          videoFile,
          contentType || ContentType.video,
          durationSeconds || BigInt(0),
          aspectRatio || 0
        );
      } catch (error) {
        console.error('Error uploading video:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: VideoId) => {
      // Note: Backend doesn't have delete functionality yet
      // This is a placeholder for future implementation
      throw new Error('Delete functionality not yet implemented in backend');
    },
    onMutate: async (videoId) => {
      // Optimistically remove from cache
      await queryClient.cancelQueries({ queryKey: ['videos'] });
      
      const previousVideos = queryClient.getQueryData(['videos', 'mostLiked']);
      
      queryClient.setQueryData(['videos', 'mostLiked'], (old: Video[] | undefined) => {
        return old?.filter(v => v.id !== videoId) || [];
      });

      return { previousVideos };
    },
    onError: (err, videoId, context) => {
      // Rollback on error
      if (context?.previousVideos) {
        queryClient.setQueryData(['videos', 'mostLiked'], context.previousVideos);
      }
      toast.error('Failed to delete video');
    },
    onSuccess: () => {
      toast.success('Video deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

// Like Queries
export function useLikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: VideoId) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.likeVideo(videoId);
      } catch (error) {
        console.error('Error liking video:', error);
        throw error;
      }
    },
    onSuccess: (_, videoId) => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['video', videoId.toString()] });
    },
  });
}

// Comment Queries
export function useGetVideoComments(videoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getVideoComments(BigInt(videoId));
      } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!videoId,
    retry: 1,
  });
}

export function useCommentOnVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, text }: { videoId: VideoId; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.commentOnVideo(videoId, text);
      } catch (error) {
        console.error('Error commenting on video:', error);
        throw error;
      }
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId.toString()] });
    },
  });
}

// Follow Queries
export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.followUser(userId);
      } catch (error) {
        console.error('Error following user:', error);
        throw error;
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.unfollowUser(userId);
      } catch (error) {
        console.error('Error unfollowing user:', error);
        throw error;
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Messaging Queries
export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipient,
      content,
      videoLink,
    }: {
      recipient: Principal;
      content: string;
      videoLink?: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.sendMessage(recipient, content, videoLink || null);
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    onSuccess: (_, { recipient }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', recipient.toString()] });
      queryClient.invalidateQueries({ queryKey: ['conversationPartners'] });
    },
  });
}

export function useGetMessagesWith(otherUserId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', otherUserId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMessagesWith(Principal.fromText(otherUserId));
      } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!otherUserId,
    refetchInterval: 3000,
    retry: 1,
  });
}

export function useGetConversationPartners() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['conversationPartners'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getConversationPartners();
      } catch (error) {
        console.error('Error fetching conversation partners:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
    retry: 1,
  });
}
