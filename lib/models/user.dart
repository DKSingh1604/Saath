class User {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? photoUrl;
  final String city;
  final UserRole role;
  final Vehicle? vehicle; // Only for drivers
  final double rating;
  final int totalRides;
  final bool isVerified;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.photoUrl,
    required this.city,
    required this.role,
    this.vehicle,
    this.rating = 0.0,
    this.totalRides = 0,
    this.isVerified = false,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
      photoUrl: json['photo_url'],
      city: json['city'],
      role: UserRole.values[json['role']],
      vehicle: json['vehicle'] != null ? Vehicle.fromJson(json['vehicle']) : null,
      rating: (json['rating'] ?? 0.0).toDouble(),
      totalRides: json['total_rides'] ?? 0,
      isVerified: json['is_verified'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'photo_url': photoUrl,
      'city': city,
      'role': role.index,
      'vehicle': vehicle?.toJson(),
      'rating': rating,
      'total_rides': totalRides,
      'is_verified': isVerified,
    };
  }
}

enum UserRole { passenger, driver, both }

class Vehicle {
  final String make;
  final String model;
  final String year;
  final String color;
  final String plateNumber;
  final int totalSeats;

  const Vehicle({
    required this.make,
    required this.model,
    required this.year,
    required this.color,
    required this.plateNumber,
    required this.totalSeats,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      make: json['make'],
      model: json['model'],
      year: json['year'],
      color: json['color'],
      plateNumber: json['plate_number'],
      totalSeats: json['total_seats'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'make': make,
      'model': model,
      'year': year,
      'color': color,
      'plate_number': plateNumber,
      'total_seats': totalSeats,
    };
  }

  String get displayName => '$year $make $model';
}