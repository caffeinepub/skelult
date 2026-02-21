import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  // Mix in Storage for file handling
  include MixinStorage();

  // Prepare Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
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

  // Video Content Type
  public type ContentType = {
    #video;
    #vidle;
  };

  // Constants for validation
  let MIN_VIDLE_DURATION_SECONDS = 5;
  let MAX_VIDLE_DURATION_SECONDS = 150; // 2 minutes 30 seconds in seconds
  let VIDLE_ASPECT_RATIO = 0.5625; // 9:16 aspect ratio as decimal

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

  // State
  var nextVideoId = 0;

  let profiles = Map.empty<UserId, UserProfile>();
  let videos = Map.empty<VideoId, Video>();
  let followersMap = Map.empty<UserId, List.List<UserId>>();
  let followingMap = Map.empty<UserId, List.List<UserId>>();
  let videoLikesMap = Map.empty<VideoId, List.List<UserId>>();
  let videoCommentsMap = Map.empty<VideoId, List.List<Comment>>();

  // Helper function to check user registration
  func ensureRegistered(caller : UserId) {
    if (not profiles.containsKey(caller)) {
      Runtime.trap("User is not registered");
    };
  };

  // Required Profile Functions
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

  // User Registration/Login
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

  // Upload Video with Validation for Vidles
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

    // Validate Vidle specific requirements
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

  // Function to validate Vidle duration
  func validateVidleDuration(durationSeconds : Nat) {
    if (durationSeconds < MIN_VIDLE_DURATION_SECONDS) {
      Runtime.trap("Vidle duration must be at least 5 seconds");
    } else if (durationSeconds > MAX_VIDLE_DURATION_SECONDS) {
      Runtime.trap("Vidle duration cannot exceed 2 minutes 30 seconds");
    };
  };

  // Function to validate Vidle aspect ratio
  func validateVidleAspectRatio(aspectRatio : Float) {
    let tolerance : Float = 0.025; // Allow small tolerance for aspect ratio validation
    if (aspectRatio < VIDLE_ASPECT_RATIO - tolerance or aspectRatio > VIDLE_ASPECT_RATIO + tolerance) {
      Runtime.trap("Vidle must have a 9:16 vertical aspect ratio");
    };
  };

  // Get Video by ID - Public query, anyone can view
  public query ({ caller }) func getVideo(id : VideoId) : async ?Video {
    videos.get(id);
  };

  // Like Video
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
      case (null) { List.empty<UserId>() };
      case (?likes) {
        if (likes.contains(caller)) {
          Runtime.trap("User has already liked this video");
        };
        likes.add(caller);
        likes;
      };
    };
    videoLikesMap.add(videoId, currentLikes);
    videos.add(videoId, { video with likes = video.likes + 1 });
  };

  // Comment on Video
  public shared ({ caller }) func commentOnVideo(videoId : VideoId, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment on videos");
    };

    ensureRegistered(caller);

    if (text.size() == 0) {
      Runtime.trap("Comment cannot be empty");
    };

    let newComment : Comment = {
      author = caller;
      text;
      timestamp = Time.now();
    };

    let currentComments = switch (videoCommentsMap.get(videoId)) {
      case (null) { List.empty<Comment>() };
      case (?c) {
        c.add(newComment);
        c;
      };
    };
    videoCommentsMap.add(videoId, currentComments);
  };

  // Follow User
  public shared ({ caller }) func followUser(target : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow other users");
    };

    ensureRegistered(caller);

    if (caller == target) {
      Runtime.trap("Cannot follow yourself");
    };

    let followers = switch (followersMap.get(target)) {
      case (null) { List.empty<UserId>() };
      case (?f) {
        if (f.contains(caller)) {
          Runtime.trap("Already following this user");
        };
        f.add(caller);
        f;
      };
    };
    followersMap.add(target, followers);

    let followings = switch (followingMap.get(caller)) {
      case (null) { List.empty<UserId>() };
      case (?f) {
        f.add(target);
        f;
      };
    };
    followingMap.add(caller, followings);

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

  // Unfollow User
  public shared ({ caller }) func unfollowUser(target : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow other users");
    };

    ensureRegistered(caller);

    if (caller == target) {
      Runtime.trap("Cannot unfollow yourself");
    };

    let followers = switch (followersMap.get(target)) {
      case (null) { List.empty<UserId>() };
      case (?f) { f.filter(func(followee) { followee != caller }) };
    };
    followersMap.add(target, followers);

    let followings = switch (followingMap.get(caller)) {
      case (null) { List.empty<UserId>() };
      case (?f) { f.filter(func(follower) { follower != target }) };
    };
    followingMap.add(caller, followings);

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

  // Get User Videos - Public query, anyone can view
  public query ({ caller }) func getUserVideos(userId : UserId) : async [Video] {
    videos.values().toArray().filter(func(video) { video.uploader == userId });
  };

  // Get Most Liked Videos - Public query, anyone can view
  public query ({ caller }) func getMostLikedVideos() : async [Video] {
    videos.values().toArray().sort(Video.compareByLikes);
  };

  // Get Comment Section for a Video - Public query, anyone can view
  public query ({ caller }) func getVideoComments(videoId : VideoId) : async [Comment] {
    switch (videoCommentsMap.get(videoId)) {
      case (null) { [] };
      case (?comments) { comments.toArray() };
    };
  };

  // Messaging System
  public type Message = {
    sender : UserId;
    recipient : UserId;
    content : Text;
    videoLink : ?Text;
    timestamp : Time.Time;
  };

  let messages = List.empty<Message>();

  // Send Message - Only authenticated users can send messages
  public shared ({ caller }) func sendMessage(recipient : UserId, content : Text, videoLink : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can send messages");
    };

    ensureRegistered(caller);

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

  // Get Messages Between Users - Only participants can view their conversation
  public query ({ caller }) func getMessagesWith(otherUser : UserId) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view messages");
    };

    messages.values().toArray().filter(
      func(message : Message) : Bool {
        (message.sender == caller and message.recipient == otherUser) or
        (message.sender == otherUser and message.recipient == caller)
      }
    );
  };

  // Get Conversation Partners - Returns unique array of user Principals who have conversed with caller
  public query ({ caller }) func getConversationPartners() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can get conversation partners");
    };

    // Collect all unique partners
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
};
