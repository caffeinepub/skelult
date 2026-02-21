import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Video {
    id: VideoId;
    title: string;
    tags: Array<string>;
    description: string;
    videoFile: ExternalBlob;
    likes: bigint;
    uploader: UserId;
    uploadTime: Time;
}
export type UserId = Principal;
export type Time = bigint;
export interface Comment {
    text: string;
    author: UserId;
    timestamp: Time;
}
export type VideoId = bigint;
export interface Message {
    content: string;
    recipient: UserId;
    sender: UserId;
    videoLink?: string;
    timestamp: Time;
}
export type Username = string;
export interface UserProfile {
    bio: string;
    username: Username;
    followers: bigint;
    following: bigint;
    profilePicture?: ExternalBlob;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    commentOnVideo(videoId: VideoId, text: string): Promise<void>;
    followUser(target: UserId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversationPartners(): Promise<Array<Principal>>;
    getMessagesWith(otherUser: UserId): Promise<Array<Message>>;
    getMostLikedVideos(): Promise<Array<Video>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserVideos(userId: UserId): Promise<Array<Video>>;
    getVideo(id: VideoId): Promise<Video | null>;
    getVideoComments(videoId: VideoId): Promise<Array<Comment>>;
    isCallerAdmin(): Promise<boolean>;
    likeVideo(videoId: VideoId): Promise<void>;
    register(username: string, bio: string, profilePic: ExternalBlob | null): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(recipient: UserId, content: string, videoLink: string | null): Promise<void>;
    unfollowUser(target: UserId): Promise<void>;
    uploadVideo(title: string, description: string, tags: Array<string>, videoFile: ExternalBlob): Promise<void>;
}
