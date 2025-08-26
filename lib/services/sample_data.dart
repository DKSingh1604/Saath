import 'package:car_pool_app/models/user.dart';
import 'package:car_pool_app/models/ride.dart';
import 'package:car_pool_app/models/chat.dart';

class SampleData {
  static final currentUser = User(
    id: 'user1',
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1234567890',
    city: 'San Francisco',
    role: UserRole.both,
    vehicle: const Vehicle(
      make: 'Toyota',
      model: 'Camry',
      year: '2022',
      color: 'Blue',
      plateNumber: 'ABC123',
      totalSeats: 4,
    ),
    rating: 4.8,
    totalRides: 47,
    isVerified: true,
  );

  static final List<User> drivers = [
    User(
      id: 'driver1',
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: '+1234567891',
      photoUrl: 'https://pixabay.com/get/gdde06686b323fd71cff9273c2422cd3bd62a5c09e563da6aeedb9f6bb205102732a99dc4e0e6d87cf24ba16ab1f6973cff08e8b2fd3daa3e335fbd0357a7f9f3_1280.jpg',
      city: 'San Francisco',
      role: UserRole.driver,
      vehicle: const Vehicle(
        make: 'Honda',
        model: 'Civic',
        year: '2021',
        color: 'White',
        plateNumber: 'XYZ789',
        totalSeats: 4,
      ),
      rating: 4.9,
      totalRides: 89,
      isVerified: true,
    ),
    User(
      id: 'driver2',
      name: 'Michael Rodriguez',
      email: 'michael.r@email.com',
      phone: '+1234567892',
      photoUrl: 'https://pixabay.com/get/ga405f1adefc688ffd1e8d124abd97269cfa0b5519baec4e121b7c049610c44747ec3752cd20cbc9632268e4067dfb8322d9682375776a69e3ab5a7e5def4a8bd_1280.jpg',
      city: 'San Francisco',
      role: UserRole.driver,
      vehicle: const Vehicle(
        make: 'Nissan',
        model: 'Altima',
        year: '2020',
        color: 'Black',
        plateNumber: 'DEF456',
        totalSeats: 5,
      ),
      rating: 4.7,
      totalRides: 65,
      isVerified: true,
    ),
    User(
      id: 'driver3',
      name: 'Emma Thompson',
      email: 'emma.t@email.com',
      phone: '+1234567893',
      city: 'San Francisco',
      role: UserRole.driver,
      vehicle: const Vehicle(
        make: 'Hyundai',
        model: 'Elantra',
        year: '2023',
        color: 'Silver',
        plateNumber: 'GHI789',
        totalSeats: 4,
      ),
      rating: 4.6,
      totalRides: 42,
      isVerified: false,
    ),
  ];

  static final List<Ride> availableRides = [
    Ride(
      id: 'ride1',
      driverId: 'driver1',
      fromLocation: 'Downtown SF',
      toLocation: 'Silicon Valley',
      date: DateTime.now().add(const Duration(days: 1)),
      time: '08:30',
      availableSeats: 3,
      contributionAmount: 15.0,
      contributionType: ContributionType.fixed,
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    ),
    Ride(
      id: 'ride2',
      driverId: 'driver2',
      fromLocation: 'Mission District',
      toLocation: 'Oakland',
      date: DateTime.now().add(const Duration(days: 1)),
      time: '09:00',
      availableSeats: 2,
      contributionAmount: 12.0,
      contributionType: ContributionType.negotiable,
      createdAt: DateTime.now().subtract(const Duration(hours: 1)),
    ),
    Ride(
      id: 'ride3',
      driverId: 'driver3',
      fromLocation: 'Financial District',
      toLocation: 'Palo Alto',
      date: DateTime.now().add(const Duration(days: 2)),
      time: '07:45',
      availableSeats: 4,
      contributionAmount: 18.0,
      contributionType: ContributionType.fixed,
      createdAt: DateTime.now().subtract(const Duration(minutes: 30)),
    ),
    Ride(
      id: 'ride4',
      driverId: 'driver1',
      fromLocation: 'SOMA',
      toLocation: 'San Jose',
      date: DateTime.now().add(const Duration(days: 3)),
      time: '17:30',
      availableSeats: 1,
      contributionAmount: 20.0,
      contributionType: ContributionType.fixed,
      createdAt: DateTime.now().subtract(const Duration(minutes: 45)),
    ),
  ];

  static final List<RideRequest> pendingRequests = [
    RideRequest(
      id: 'req1',
      rideId: 'ride1',
      passengerId: 'passenger1',
      pickupPoint: 'Montgomery BART Station',
      offeredAmount: 15.0,
      status: RequestStatus.pending,
      createdAt: DateTime.now().subtract(const Duration(minutes: 30)),
    ),
    RideRequest(
      id: 'req2',
      rideId: 'ride2',
      passengerId: 'passenger2',
      pickupPoint: '24th Street BART',
      offeredAmount: 10.0,
      status: RequestStatus.pending,
      createdAt: DateTime.now().subtract(const Duration(minutes: 15)),
    ),
  ];

  static final List<ChatMessage> sampleMessages = [
    ChatMessage(
      id: 'msg1',
      rideId: 'ride1',
      senderId: 'driver1',
      message: 'Hi! I\'ll be driving a white Honda Civic. I\'ll pick you up at Montgomery BART at 8:30 AM sharp.',
      timestamp: DateTime.now().subtract(const Duration(hours: 2)),
    ),
    ChatMessage(
      id: 'msg2',
      rideId: 'ride1',
      senderId: 'user1',
      message: 'Perfect! I\'ll be waiting by the main entrance. Thank you!',
      timestamp: DateTime.now().subtract(const Duration(hours: 1, minutes: 45)),
    ),
    ChatMessage(
      id: 'msg3',
      rideId: 'ride1',
      senderId: 'driver1',
      message: 'Great! See you tomorrow morning. Have a good evening! 👋',
      timestamp: DateTime.now().subtract(const Duration(hours: 1, minutes: 30)),
    ),
  ];

  static final List<RideReview> sampleReviews = [
    RideReview(
      id: 'review1',
      rideId: 'completed_ride1',
      reviewerId: 'user1',
      revieweeId: 'driver1',
      rating: 5,
      comment: 'Excellent driver! Very punctual and friendly. Car was clean and comfortable.',
      tags: ['Punctual', 'Friendly', 'Clean Car'],
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
    RideReview(
      id: 'review2',
      rideId: 'completed_ride2',
      reviewerId: 'driver2',
      revieweeId: 'user1',
      rating: 5,
      comment: 'Great passenger! On time and respectful.',
      tags: ['Punctual', 'Respectful'],
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
  ];

  static User? getUserById(String id) {
    if (id == currentUser.id) return currentUser;
    return drivers.firstWhere((driver) => driver.id == id);
  }

  static List<Ride> getRidesForDriver(String driverId) {
    return availableRides.where((ride) => ride.driverId == driverId).toList();
  }

  static List<RideRequest> getRequestsForRide(String rideId) {
    return pendingRequests.where((request) => request.rideId == rideId).toList();
  }

  static List<ChatMessage> getMessagesForRide(String rideId) {
    return sampleMessages.where((message) => message.rideId == rideId).toList();
  }
}