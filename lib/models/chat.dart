class ChatMessage {
  final String id;
  final String rideId;
  final String senderId;
  final String message;
  final DateTime timestamp;
  final MessageType type;

  const ChatMessage({
    required this.id,
    required this.rideId,
    required this.senderId,
    required this.message,
    required this.timestamp,
    this.type = MessageType.text,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      rideId: json['ride_id'],
      senderId: json['sender_id'],
      message: json['message'],
      timestamp: DateTime.parse(json['timestamp']),
      type: MessageType.values[json['type'] ?? 0],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ride_id': rideId,
      'sender_id': senderId,
      'message': message,
      'timestamp': timestamp.toIso8601String(),
      'type': type.index,
    };
  }

  String get timeDisplay {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return '${timestamp.day}/${timestamp.month}';
    }
  }
}

enum MessageType { text, system }

class RideReview {
  final String id;
  final String rideId;
  final String reviewerId;
  final String revieweeId;
  final int rating; // 1-5 stars
  final String? comment;
  final List<String> tags;
  final DateTime createdAt;

  const RideReview({
    required this.id,
    required this.rideId,
    required this.reviewerId,
    required this.revieweeId,
    required this.rating,
    this.comment,
    this.tags = const [],
    required this.createdAt,
  });

  factory RideReview.fromJson(Map<String, dynamic> json) {
    return RideReview(
      id: json['id'],
      rideId: json['ride_id'],
      reviewerId: json['reviewer_id'],
      revieweeId: json['reviewee_id'],
      rating: json['rating'],
      comment: json['comment'],
      tags: List<String>.from(json['tags'] ?? []),
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ride_id': rideId,
      'reviewer_id': reviewerId,
      'reviewee_id': revieweeId,
      'rating': rating,
      'comment': comment,
      'tags': tags,
      'created_at': createdAt.toIso8601String(),
    };
  }
}