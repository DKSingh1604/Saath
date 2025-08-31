class User {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? profilePicture;
  final String city;
  final DateTime? dateOfBirth;
  final String gender;
  final bool isDriver;
  final Vehicle? vehicle;
  final DrivingLicense? drivingLicense;
  final UserRating rating;
  final TotalRides totalRides;
  final UserPreferences preferences;
  final VerificationStatus isVerified;
  final bool isActive;
  final DateTime? lastLogin;
  final DateTime createdAt;
  final DateTime updatedAt;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.profilePicture,
    required this.city,
    this.dateOfBirth,
    this.gender = 'prefer_not_to_say',
    this.isDriver = false,
    this.vehicle,
    this.drivingLicense,
    required this.rating,
    required this.totalRides,
    required this.preferences,
    required this.isVerified,
    this.isActive = true,
    this.lastLogin,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      profilePicture: json['profilePicture'] ?? json['photo_url'],
      city: json['city'] ?? '',
      dateOfBirth: json['dateOfBirth'] != null
          ? DateTime.parse(json['dateOfBirth'])
          : null,
      gender: json['gender'] ?? 'prefer_not_to_say',
      isDriver: json['isDriver'] ?? false,
      vehicle:
          json['vehicle'] != null ? Vehicle.fromJson(json['vehicle']) : null,
      drivingLicense: json['drivingLicense'] != null
          ? DrivingLicense.fromJson(json['drivingLicense'])
          : null,
      rating: json['rating'] != null
          ? UserRating.fromJson(json['rating'])
          : const UserRating(),
      totalRides: json['totalRides'] != null
          ? TotalRides.fromJson(json['totalRides'])
          : const TotalRides(),
      preferences: json['preferences'] != null
          ? UserPreferences.fromJson(json['preferences'])
          : const UserPreferences(),
      isVerified: json['isVerified'] != null
          ? VerificationStatus.fromJson(json['isVerified'])
          : const VerificationStatus(),
      isActive: json['isActive'] ?? true,
      lastLogin:
          json['lastLogin'] != null ? DateTime.parse(json['lastLogin']) : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'profilePicture': profilePicture,
      'city': city,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'gender': gender,
      'isDriver': isDriver,
      'vehicle': vehicle?.toJson(),
      'drivingLicense': drivingLicense?.toJson(),
      'rating': rating.toJson(),
      'totalRides': totalRides.toJson(),
      'preferences': preferences.toJson(),
      'isVerified': isVerified.toJson(),
      'isActive': isActive,
      'lastLogin': lastLogin?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // UI helper methods
  String get displayName => name.isNotEmpty ? name : email.split('@')[0];
  bool get isFullyVerified => isVerified.isFullyVerified;
  bool get isBasicVerified => isVerified.isBasicVerified;
  int get totalRideCount => totalRides.total;
  double get averageRating => rating.average;

  // Age calculation (UI helper)
  int? get age {
    if (dateOfBirth == null) return null;
    final today = DateTime.now();
    int age = today.year - dateOfBirth!.year;
    if (today.month < dateOfBirth!.month ||
        (today.month == dateOfBirth!.month && today.day < dateOfBirth!.day)) {
      age--;
    }
    return age;
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
      make: json['make'] ?? '',
      model: json['model'] ?? '',
      year: json['year']?.toString() ?? '',
      color: json['color'] ?? '',
      plateNumber: json['plateNumber'] ?? json['plate_number'] ?? '',
      totalSeats: json['seats'] ?? json['total_seats'] ?? 4,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'make': make,
      'model': model,
      'year': int.tryParse(year) ?? 0,
      'color': color,
      'plateNumber': plateNumber,
      'seats': totalSeats,
    };
  }

  String get displayName => '$year $make $model';
}

class DrivingLicense {
  final String? number;
  final DateTime? expiryDate;

  const DrivingLicense({
    this.number,
    this.expiryDate,
  });

  factory DrivingLicense.fromJson(Map<String, dynamic> json) {
    return DrivingLicense(
      number: json['number'],
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'number': number,
      'expiryDate': expiryDate?.toIso8601String(),
    };
  }
}

class UserRating {
  final double average;
  final int count;

  const UserRating({
    this.average = 0.0,
    this.count = 0,
  });

  factory UserRating.fromJson(Map<String, dynamic> json) {
    return UserRating(
      average: (json['average'] ?? 0.0).toDouble(),
      count: json['count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'average': average,
      'count': count,
    };
  }
}

class TotalRides {
  final int asDriver;
  final int asPassenger;

  const TotalRides({
    this.asDriver = 0,
    this.asPassenger = 0,
  });

  factory TotalRides.fromJson(Map<String, dynamic> json) {
    return TotalRides(
      asDriver: json['asDriver'] ?? 0,
      asPassenger: json['asPassenger'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'asDriver': asDriver,
      'asPassenger': asPassenger,
    };
  }

  int get total => asDriver + asPassenger;
}

class UserPreferences {
  final bool smokingAllowed;
  final bool petsAllowed;
  final String musicPreference;
  final String conversationLevel;

  const UserPreferences({
    this.smokingAllowed = false,
    this.petsAllowed = false,
    this.musicPreference = 'any',
    this.conversationLevel = 'some_chat',
  });

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      smokingAllowed: json['smokingAllowed'] ?? false,
      petsAllowed: json['petsAllowed'] ?? false,
      musicPreference: json['musicPreference'] ?? 'any',
      conversationLevel: json['conversationLevel'] ?? 'some_chat',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'smokingAllowed': smokingAllowed,
      'petsAllowed': petsAllowed,
      'musicPreference': musicPreference,
      'conversationLevel': conversationLevel,
    };
  }
}

class VerificationStatus {
  final bool email;
  final bool phone;
  final bool identity;
  final bool drivingLicense;

  const VerificationStatus({
    this.email = false,
    this.phone = false,
    this.identity = false,
    this.drivingLicense = false,
  });

  factory VerificationStatus.fromJson(Map<String, dynamic> json) {
    return VerificationStatus(
      email: json['email'] ?? false,
      phone: json['phone'] ?? false,
      identity: json['identity'] ?? false,
      drivingLicense: json['drivingLicense'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'phone': phone,
      'identity': identity,
      'drivingLicense': drivingLicense,
    };
  }

  bool get isFullyVerified => email && phone && identity;
  bool get isBasicVerified => email && phone;
}
