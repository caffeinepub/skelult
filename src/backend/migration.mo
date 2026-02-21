import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type UserId = Principal;
  type Username = Text;
  type VideoId = Nat;

  type OldUserProfile = {
    username : Username;
    bio : Text;
    profilePicture : ?Blob;
    followers : Nat;
    following : Nat;
  };

  type OldVideo = {
    id : VideoId;
    uploader : UserId;
    title : Text;
    description : Text;
    tags : [Text];
    videoFile : Blob;
    likes : Nat;
    uploadTime : Time.Time;
    contentType : {
      #video;
      #vidle;
    };
    durationSeconds : Nat;
    aspectRatio : Float;
  };

  type Comment = {
    author : UserId;
    text : Text;
    timestamp : Time.Time;
  };

  type OldActor = {
    nextVideoId : Nat;
    profiles : Map.Map<UserId, OldUserProfile>;
    videos : Map.Map<VideoId, OldVideo>;
    followersMap : Map.Map<UserId, List.List<UserId>>;
    followingMap : Map.Map<UserId, List.List<UserId>>;
    videoLikesMap : Map.Map<VideoId, List.List<UserId>>;
    videoCommentsMap : Map.Map<VideoId, List.List<Comment>>;
    messages : List.List<{
      sender : UserId;
      recipient : UserId;
      content : Text;
      videoLink : ?Text;
      timestamp : Time.Time;
    }>;
  };

  type NewFriendRequest = {
    sender : UserId;
    recipient : UserId;
    status : {
      #pending;
      #accepted;
      #declined;
    };
    timestamp : Time.Time;
  };

  type NewActor = {
    nextVideoId : Nat;
    profiles : Map.Map<UserId, OldUserProfile>;
    videos : Map.Map<VideoId, OldVideo>;
    followersMap : Map.Map<UserId, List.List<UserId>>;
    followingMap : Map.Map<UserId, List.List<UserId>>;
    videoLikesMap : Map.Map<VideoId, List.List<UserId>>;
    videoCommentsMap : Map.Map<VideoId, List.List<Comment>>;
    messages : List.List<{
      sender : UserId;
      recipient : UserId;
      content : Text;
      videoLink : ?Text;
      timestamp : Time.Time;
    }>;
    friendRequests : Map.Map<Text, NewFriendRequest>;
  };

  public func run(old : OldActor) : NewActor {
    { old with friendRequests = Map.empty<Text, NewFriendRequest>() };
  };
};
