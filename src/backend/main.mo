import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserId = Principal;
  type Username = Text;
  type VideoId = Nat;

  public type UserProfile = {
    username : Username;
    bio : Text;
    profilePicture : ?Storage.ExternalBlob;
    followers : Nat;
    following : Nat;
  };

  public type ContentType = {
    #video;
    #vidle;
  };

  public type Video = {
    id : VideoId;
    uploader : UserId;
    title : Text;
    description : Text;
    tags : [Text];
    videoFile : Storage.ExternalBlob;
    likes : Nat;
    uploadTime : Time.Time;
    contentType : ContentType;
    durationSeconds : Nat;
    aspectRatio : Float;
  };

  type Comment = {
    author : UserId;
    text : Text;
    timestamp : Time.Time;
  };

  module Video {
    public func compareByLikes(video1 : Video, video2 : Video) : Order.Order {
      Nat.compare(video2.likes, video1.likes);
    };
  };

  var nextVideoId = 0;

  let profiles = Map.empty<UserId, UserProfile>();
  let videos = Map.empty<VideoId, Video>();
  let followersMap = Map.empty<UserId, List.List<UserId>>();
  let followingMap = Map.empty<UserId, List.List<UserId>>();
  let videoLikesMap = Map.empty<VideoId, List.List<UserId>>();
  let videoCommentsMap = Map.empty<VideoId, List.List<Comment>>();

  func ensureRegistered(caller : UserId) {
    if (not profiles.containsKey(caller)) {
      Runtime.trap("User is not registered");
    };
  };

  let MIN_VIDLE_DURATION_SECONDS = 5;
  let MAX_VIDLE_DURATION_SECONDS = 150;
  let VIDLE_ASPECT_RATIO = 0.5625;

  public type FriendRequestStatus = {
    #pending;
    #accepted;
    #declined;
  };

  public type FriendRequest = {
    sender : UserId;
    recipient : UserId;
    status : FriendRequestStatus;
    timestamp : Time.Time;
  };

  type FriendRequestKey = {
    sender : UserId;
    recipient : UserId;
  };

  let friendRequests = Map.empty<Text, FriendRequest>();

  func makeFriendRequestKey(sender : UserId, recipient : UserId) : Text {
    sender.toText() # ":" # recipient.toText();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func sendFriendRequest(recipient : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send friend requests");
    };

    ensureRegistered(caller);

    if (not profiles.containsKey(recipient)) {
      Runtime.trap("Recipient user does not exist");
    };

    if (caller == recipient) {
      Runtime.trap("Cannot send friend request to yourself");
    };

    let key = makeFriendRequestKey(caller, recipient);
    
    switch (friendRequests.get(key)) {
      case (?existing) {
        if (existing.status == #pending) {
          Runtime.trap("Friend request already pending");
        };
        if (existing.status == #accepted) {
          Runtime.trap("Already friends with this user");
        };
      };
      case (null) {};
    };

    let reverseKey = makeFriendRequestKey(recipient, caller);
    switch (friendRequests.get(reverseKey)) {
      case (?existing) {
        if (existing.status == #accepted) {
          Runtime.trap("Already friends with this user");
        };
      };
      case (null) {};
    };

    let newRequest : FriendRequest = {
      sender = caller;
      recipient;
      status = #pending;
      timestamp = Time.now();
    };

    friendRequests.add(key, newRequest);
  };

  public shared ({ caller }) func acceptFriendRequest(sender : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept friend requests");
    };

    ensureRegistered(caller);

    let key = makeFriendRequestKey(sender, caller);
    
    switch (friendRequests.get(key)) {
      case (null) {
        Runtime.trap("No friend request from this sender");
      };
      case (?request) {
        if (request.status != #pending) {
          Runtime.trap("Friend request is not pending");
        };
        
        let updatedRequest = {
          request with status = #accepted
        };
        friendRequests.add(key, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func declineFriendRequest(sender : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can decline friend requests");
    };

    ensureRegistered(caller);

    let key = makeFriendRequestKey(sender, caller);
    
    switch (friendRequests.get(key)) {
      case (null) {
        Runtime.trap("No friend request from this sender");
      };
      case (?request) {
        if (request.status != #pending) {
          Runtime.trap("Friend request is not pending");
        };
        
        let updatedRequest = {
          request with status = #declined
        };
        friendRequests.add(key, updatedRequest);
      };
    };
  };

  public query ({ caller }) func getPendingFriendRequests() : async [FriendRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get pending friend requests");
    };

    ensureRegistered(caller);

    let pendingRequests = List.empty<FriendRequest>();
    for ((_, request) in friendRequests.entries()) {
      if (request.recipient == caller and request.status == #pending) {
        pendingRequests.add(request);
      };
    };
    pendingRequests.toArray();
  };

  public query ({ caller }) func getAcceptedFriendsList() : async [UserId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get friends list");
    };

    ensureRegistered(caller);

    let friends = List.empty<UserId>();
    for ((_, request) in friendRequests.entries()) {
      if (request.status == #accepted) {
        if (request.sender == caller) {
          friends.add(request.recipient);
        } else if (request.recipient == caller) {
          friends.add(request.sender);
        };
      };
    };
    friends.toArray();
  };

  public shared ({ caller }) func unfriend(friend : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfriend");
    };

    ensureRegistered(caller);

    if (caller == friend) {
      Runtime.trap("Cannot unfriend yourself");
    };

    let key1 = makeFriendRequestKey(caller, friend);
    let key2 = makeFriendRequestKey(friend, caller);

    var found = false;

    switch (friendRequests.get(key1)) {
      case (?request) {
        if (request.status == #accepted) {
          friendRequests.remove(key1);
          found := true;
        };
      };
      case (null) {};
    };

    switch (friendRequests.get(key2)) {
      case (?request) {
        if (request.status == #accepted) {
          friendRequests.remove(key2);
          found := true;
        };
      };
      case (null) {};
    };

    if (not found) {
      Runtime.trap("Not friends with this user");
    };
  };

  public query ({ caller }) func searchUsers(searchTerm : Text) : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for other users");
    };

    if (searchTerm.size() == 0) { return [] };
    
    profiles.values().toArray().filter(
      func(profile) {
        profile.username.contains(#text searchTerm) or profile.bio.contains(#text searchTerm);
      }
    );
  };

  public shared ({ caller }) func register(username : Text, bio : Text, profilePic : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register");
    };

    if (profiles.containsKey(caller)) {
      Runtime.trap("User is already registered");
    };

    let profile : UserProfile = {
      username;
      bio;
      profilePicture = profilePic;
      followers = 0;
      following = 0;
    };

    profiles.add(caller, profile);
  };

  public shared ({ caller }) func uploadVideo(
    title : Text,
    description : Text,
    tags : [Text],
    videoFile : Storage.ExternalBlob,
    contentType : ContentType,
    durationSeconds : Nat,
    aspectRatio : Float,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload videos");
    };

    ensureRegistered(caller);

    switch (contentType) {
      case (#vidle) {
        validateVidleDuration(durationSeconds);
        validateVidleAspectRatio(aspectRatio);
      };
      case (_) {};
    };

    let video : Video = {
      id = nextVideoId;
      uploader = caller;
      title;
      description;
      tags;
      videoFile;
      likes = 0;
      uploadTime = Time.now();
      contentType;
      durationSeconds;
      aspectRatio;
    };

    videos.add(nextVideoId, video);
    nextVideoId += 1;
  };

  func validateVidleDuration(durationSeconds : Nat) {
    if (durationSeconds < MIN_VIDLE_DURATION_SECONDS) {
      Runtime.trap("Vidle duration must be at least 5 seconds");
    } else if (durationSeconds > MAX_VIDLE_DURATION_SECONDS) {
      Runtime.trap("Vidle duration cannot exceed 2 minutes 30 seconds");
    };
  };

  func validateVidleAspectRatio(aspectRatio : Float) {
    let tolerance : Float = 0.025;
    if (aspectRatio < VIDLE_ASPECT_RATIO - tolerance or aspectRatio > VIDLE_ASPECT_RATIO + tolerance) {
      Runtime.trap("Vidle must have a 9:16 vertical aspect ratio");
    };
  };

  public query ({ caller }) func getVideo(id : VideoId) : async ?Video {
    videos.get(id);
  };

  public shared ({ caller }) func likeVideo(videoId : VideoId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like videos");
    };

    ensureRegistered(caller);

    let video = switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video does not exist") };
      case (?v) { v };
    };

    let currentLikes = switch (videoLikesMap.get(videoId)) {
      case (null) {
        let newList = List.empty<UserId>();
        newList.add(caller);
        videoLikesMap.add(videoId, newList);
        newList;
      };
      case (?likes) {
        if (likes.contains(caller)) {
          Runtime.trap("User has already liked this video");
        };
        likes.add(caller);
        videoLikesMap.add(videoId, likes);
        likes;
      };
    };
    
    videos.add(videoId, { video with likes = video.likes + 1 });
  };

  public shared ({ caller }) func commentOnVideo(videoId : VideoId, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment on videos");
    };

    ensureRegistered(caller);

    if (not videos.containsKey(videoId)) {
      Runtime.trap("Video does not exist");
    };

    if (text.size() == 0) {
      Runtime.trap("Comment cannot be empty");
    };

    let newComment : Comment = {
      author = caller;
      text;
      timestamp = Time.now();
    };

    let currentComments = switch (videoCommentsMap.get(videoId)) {
      case (null) {
        let newList = List.empty<Comment>();
        newList.add(newComment);
        videoCommentsMap.add(videoId, newList);
        newList;
      };
      case (?c) {
        c.add(newComment);
        videoCommentsMap.add(videoId, c);
        c;
      };
    };
  };

  public shared ({ caller }) func followUser(target : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow other users");
    };

    ensureRegistered(caller);

    if (not profiles.containsKey(target)) {
      Runtime.trap("Target user does not exist");
    };

    if (caller == target) {
      Runtime.trap("Cannot follow yourself");
    };

    let followers = switch (followersMap.get(target)) {
      case (null) {
        let newList = List.empty<UserId>();
        newList.add(caller);
        followersMap.add(target, newList);
        newList;
      };
      case (?f) {
        if (f.contains(caller)) {
          Runtime.trap("Already following this user");
        };
        f.add(caller);
        followersMap.add(target, f);
        f;
      };
    };

    let followings = switch (followingMap.get(caller)) {
      case (null) {
        let newList = List.empty<UserId>();
        newList.add(target);
        followingMap.add(caller, newList);
        newList;
      };
      case (?f) {
        f.add(target);
        followingMap.add(caller, f);
        f;
      };
    };

    let targetProfile = switch (profiles.get(target)) {
      case (null) { Runtime.trap("Target user does not exist") };
      case (?p) { p };
    };
    profiles.add(target, { targetProfile with followers = targetProfile.followers + 1 });

    let callerProfile = switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Caller profile not found") };
      case (?p) { p };
    };
    profiles.add(caller, { callerProfile with following = callerProfile.following + 1 });
  };

  public shared ({ caller }) func unfollowUser(target : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow other users");
    };

    ensureRegistered(caller);

    if (not profiles.containsKey(target)) {
      Runtime.trap("Target user does not exist");
    };

    if (caller == target) {
      Runtime.trap("Cannot unfollow yourself");
    };

    let followers = switch (followersMap.get(target)) {
      case (null) { Runtime.trap("Not following this user") };
      case (?f) {
        if (not f.contains(caller)) {
          Runtime.trap("Not following this user");
        };
        let filtered = f.filter(func(followee) { followee != caller });
        followersMap.add(target, filtered);
        filtered;
      };
    };

    let followings = switch (followingMap.get(caller)) {
      case (null) { List.empty<UserId>() };
      case (?f) {
        let filtered = f.filter(func(follower) { follower != target });
        followingMap.add(caller, filtered);
        filtered;
      };
    };

    let targetProfile = switch (profiles.get(target)) {
      case (null) { Runtime.trap("Target user does not exist") };
      case (?p) { p };
    };
    profiles.add(target, { targetProfile with followers = targetProfile.followers - 1 : Nat });

    let callerProfile = switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Caller profile not found") };
      case (?p) { p };
    };
    profiles.add(caller, { callerProfile with following = callerProfile.following - 1 : Nat });
  };

  public query ({ caller }) func getUserVideos(userId : UserId) : async [Video] {
    videos.values().toArray().filter(func(video) { video.uploader == userId });
  };

  public query ({ caller }) func getMostLikedVideos() : async [Video] {
    videos.values().toArray().sort(Video.compareByLikes);
  };

  public query ({ caller }) func getVideoComments(videoId : VideoId) : async [Comment] {
    switch (videoCommentsMap.get(videoId)) {
      case (null) { [] };
      case (?comments) { comments.toArray() };
    };
  };

  public type Message = {
    sender : UserId;
    recipient : UserId;
    content : Text;
    videoLink : ?Text;
    timestamp : Time.Time;
  };

  let messages = List.empty<Message>();

  public shared ({ caller }) func sendMessage(recipient : UserId, content : Text, videoLink : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can send messages");
    };

    ensureRegistered(caller);

    if (not profiles.containsKey(recipient)) {
      Runtime.trap("Recipient user does not exist");
    };

    if (content.size() == 0) {
      Runtime.trap("Message content cannot be empty");
    };

    if (caller == recipient) {
      Runtime.trap("Cannot send message to yourself");
    };

    let message : Message = {
      sender = caller;
      recipient;
      content;
      videoLink;
      timestamp = Time.now();
    };

    messages.add(message);
  };

  public query ({ caller }) func getMessagesWith(otherUser : UserId) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view messages");
    };

    ensureRegistered(caller);

    messages.values().toArray().filter(
      func(message : Message) : Bool {
        (message.sender == caller and message.recipient == otherUser) or
        (message.sender == otherUser and message.recipient == caller)
      }
    );
  };

  public query ({ caller }) func getConversationPartners() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can get conversation partners");
    };

    ensureRegistered(caller);

    let partnersMap = Map.empty<Principal, Bool>();

    for (message in messages.values()) {
      if (message.sender == caller) {
        partnersMap.add(message.recipient, true);
      } else if (message.recipient == caller) {
        partnersMap.add(message.sender, true);
      };
    };

    partnersMap.keys().toArray();
  };

  public shared ({ caller }) func deleteVideo(videoId : VideoId) : async () {
    let video = switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video does not exist") };
      case (?v) { v };
    };
    
    if (not (AccessControl.isAdmin(accessControlState, caller)) and caller != video.uploader) {
      Runtime.trap("Unauthorized: Only admins or video owners can delete videos");
    };
    
    videos.remove(videoId);
  };
};
