class Ride {
  final String id;
  final String driverId;
  final String fromLocation;
  final String toLocation;
  final DateTime date;
  final String time; // Store as string for simplicity, e.g., "08:30"
  final int availableSeats;
  final double contributionAmount;
  final ContributionType contributionType;
  final RideStatus status;
  final DateTime createdAt;

  const Ride({
    required this.id,
    required this.driverId,
    required this.fromLocation,
    required this.toLocation,
    required this.date,
    required this.time,
    required this.availableSeats,
    required this.contributionAmount,
    required this.contributionType,
    this.status = RideStatus.active,
    required this.createdAt,
  });

  factory Ride.fromJson(Map<String, dynamic> json) {
    return Ride(
      id: json['id'],
      driverId: json['driver_id'],
      fromLocation: json['from_location'],
      toLocation: json['to_location'],
      date: DateTime.parse(json['date']),
      time: json['time'],
      availableSeats: json['available_seats'],
      contributionAmount: (json['contribution_amount'] ?? 0.0).toDouble(),
      contributionType: ContributionType.values[json['contribution_type']],
      status: RideStatus.values[json['status'] ?? 0],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'driver_id': driverId,
      'from_location': fromLocation,
      'to_location': toLocation,
      'date': date.toIso8601String(),
      'time': time,
      'available_seats': availableSeats,
      'contribution_amount': contributionAmount,
      'contribution_type': contributionType.index,
      'status': status.index,
      'created_at': createdAt.toIso8601String(),
    };
  }

  String get dateTimeDisplay {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}, ${date.year} at $time';
  }
}

enum ContributionType { fixed, negotiable }

enum RideStatus { active, cancelled, completed }

class RideRequest {
  final String id;
  final String rideId;
  final String passengerId;
  final String pickupPoint;
  final double offeredAmount;
  final RequestStatus status;
  final DateTime createdAt;

  const RideRequest({
    required this.id,
    required this.rideId,
    required this.passengerId,
    required this.pickupPoint,
    required this.offeredAmount,
    this.status = RequestStatus.pending,
    required this.createdAt,
  });

  factory RideRequest.fromJson(Map<String, dynamic> json) {
    return RideRequest(
      id: json['id'],
      rideId: json['ride_id'],
      passengerId: json['passenger_id'],
      pickupPoint: json['pickup_point'],
      offeredAmount: (json['offered_amount'] ?? 0.0).toDouble(),
      status: RequestStatus.values[json['status'] ?? 0],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ride_id': rideId,
      'passenger_id': passengerId,
      'pickup_point': pickupPoint,
      'offered_amount': offeredAmount,
      'status': status.index,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

enum RequestStatus { pending, accepted, rejected }