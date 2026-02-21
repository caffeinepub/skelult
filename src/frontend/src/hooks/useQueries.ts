import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Video, Comment, VideoId, UserId, Message } from '../backend';
import type { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
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
      const principal = await import('@dfinity/principal').then(m => m.Principal.fromText(userId));
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
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
      return actor.getMostLikedVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideo(videoId: VideoId) {
  const { actor, isFetching } = useActor();

  return useQuery<Video | null>({
    queryKey: ['video', videoId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVideo(videoId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserVideos(userId: UserId) {
  const { actor, isFetching } = useActor();

  return useQuery<Video[]>({
    queryKey: ['userVideos', userId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserVideos(userId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { title: string; description: string; tags: string[]; videoFile: any }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadVideo(params.title, params.description, params.tags, params.videoFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: VideoId) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - deleteVideo method will be added to backend
      return actor.deleteVideo(videoId);
    },
    onMutate: async (videoId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['videos'] });
      await queryClient.cancelQueries({ queryKey: ['userVideos'] });

      // Snapshot previous values
      const previousMostLiked = queryClient.getQueryData<Video[]>(['videos', 'mostLiked']);
      
      // Optimistically update most liked videos
      queryClient.setQueryData<Video[]>(['videos', 'mostLiked'], (old) => {
        if (!old) return [];
        return old.filter(v => v.id !== videoId);
      });

      // Optimistically update user videos for all cached user video queries
      queryClient.setQueriesData<Video[]>(
        { queryKey: ['userVideos'] },
        (old) => {
          if (!old) return [];
          return old.filter(v => v.id !== videoId);
        }
      );

      return { previousMostLiked };
    },
    onError: (error, videoId, context) => {
      // Revert optimistic updates on error
      if (context?.previousMostLiked) {
        queryClient.setQueryData(['videos', 'mostLiked'], context.previousMostLiked);
      }
      toast.error('Failed to delete video. Please try again.');
      console.error('Delete video error:', error);
    },
    onSuccess: () => {
      toast.success('Video deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
    },
  });
}

// Like Mutation
export function useLikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: VideoId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.likeVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
    },
  });
}

// Comment Queries
export function useGetVideoComments(videoId: VideoId) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', videoId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVideoComments(videoId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { videoId: VideoId; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.commentOnVideo(params.videoId, params.text);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.videoId.toString()] });
    },
  });
}

// Follow Mutations
export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: UserId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.followUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: UserId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unfollowUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Messaging Queries
export function useGetConversationPartners() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['conversationPartners'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversationPartners();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useGetMessagesWith(otherUser: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', otherUser.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessagesWith(otherUser);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recipient: Principal; content: string; videoLink: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(params.recipient, params.content, params.videoLink);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversationPartners'] });
    },
  });
}
