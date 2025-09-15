# Per-Ride Role Selection System

## Overview
The Car Pool app uses a **per-ride role selection** system where users choose to be either a **driver** or **passenger** for each individual trip, rather than having a fixed role during registration.

## Key Concepts

### 🚗 Offer a Ride (Driver Role)
- **When to choose**: You have a vehicle and can take passengers
- **What you provide**: Vehicle details, route, departure time, available seats, pricing
- **Benefits**: Share travel costs, meet new people, contribute to carpooling

### 🧳 Find a Ride (Passenger Role)  
- **When to choose**: You need transportation and want to join someone else's ride
- **What you do**: Search for rides, book seats, pay your share
- **Benefits**: Save money, no driving stress, environmentally friendly

## User Experience Flow

### Registration (Minimal)
Users only provide essential information:
- Name, email, phone, password
- City (for ride matching)
- Optional: Date of birth, gender, profile picture

**No driver license, vehicle info, or role selection required during registration.**

### Home Screen Role Selection
After login, users see clear options:
1. **"Offer a Ride"** → Create ride as driver
2. **"Find a Ride"** → Search for rides as passenger

### Per-Ride Flexibility
- **Today**: User can offer a ride (driver) in their car
- **Tomorrow**: Same user can find a ride (passenger) if they don't have their car
- **Next week**: Back to offering rides when they have vehicle access

## Technical Implementation

### Backend API Endpoints

#### Create Ride (Driver)
```http
POST /api/rides
Authorization: Bearer {token}
Content-Type: application/json

{
  "origin": {
    "address": "123 Start St, City",
    "coordinates": [-73.935242, 40.730610],
    "city": "City Name"
  },
  "destination": {
    "address": "456 End Ave, City", 
    "coordinates": [-73.935242, 40.735610],
    "city": "City Name"
  },
  "departureTime": "2025-09-15T10:00:00Z",
  "availableSeats": 3,
  "pricePerSeat": 15.50,
  "vehicleInfo": {
    "make": "Toyota",
    "model": "Camry", 
    "color": "Blue",
    "plateNumber": "ABC123"
  },
  "route": {
    "distance": 25,
    "duration": 45
  }
}
```

#### Book Ride (Passenger)
```http
POST /api/rides/{rideId}/book
Authorization: Bearer {token}
Content-Type: application/json

{
  "seatsBooked": 2,
  "pickupPoint": {
    "address": "Custom pickup location (optional)"
  },
  "dropoffPoint": {
    "address": "Custom dropoff location (optional)"
  }
}
```

### Frontend Implementation

#### Home Screen
```dart
// Two main action cards
_buildRoleCard(
  title: 'Offer a Ride',
  subtitle: 'I have a car and can take passengers',
  icon: Icons.drive_eta,
  onTap: () => Navigator.push(context, PostRideScreen()),
)

_buildRoleCard(
  title: 'Find a Ride', 
  subtitle: 'I need a ride to my destination',
  icon: Icons.person_search,
  onTap: () => Navigator.push(context, FindRidesScreen()),
)
```

## Benefits of This Approach

### 🎯 User Experience
- **Simplified onboarding**: Faster registration with minimal required info
- **Flexible usage**: Users aren't locked into a single role
- **Real-world scenarios**: Matches how people actually use carpooling
- **Lower barrier to entry**: No commitment to being "a driver" or "a passenger"

### 🏗️ Technical Advantages  
- **Cleaner data model**: User profiles only contain essential personal info
- **Per-ride context**: Vehicle info, preferences stored with each ride
- **Better scalability**: Same user can create multiple rides with different vehicles
- **Reduced complexity**: No need to manage user role changes

### 🚀 Business Benefits
- **Higher conversion**: Easier signup process
- **Increased engagement**: Users can participate in multiple ways
- **Better matching**: More flexible supply/demand dynamics
- **User retention**: Users aren't limited by their initial role choice

## Edge Cases Handled

### Booking Validation
- ❌ Users cannot book their own rides
- ❌ Cannot book more seats than available  
- ❌ Cannot double-book the same ride
- ❌ Cannot book rides that have already departed
- ✅ Automatic total cost calculation
- ✅ Real-time seat availability updates

### User State Management
- ✅ Tracks separate counts for rides as driver vs passenger
- ✅ Maintains rating history across both roles
- ✅ Email verification required for all ride activities
- ✅ Account deactivation prevents all ride activities

## Testing
Comprehensive test suite covers:
- ✅ Ride creation with per-ride vehicle info
- ✅ Passenger booking with validation
- ✅ Edge case prevention (own ride, insufficient seats, etc.)
- ✅ User statistics tracking
- ✅ Minimal registration flow
- ✅ Schema validation (no legacy driver fields)

## Migration Notes
If upgrading from a fixed-role system:
1. **User data**: Remove `isDriver`, `vehicle`, `preferences` fields from user profiles
2. **Registration**: Update forms to collect only essential info
3. **UI flow**: Replace role-based navigation with per-ride selection
4. **API changes**: Ride creation now accepts vehicle info in request body
5. **Testing**: Validate that users can successfully switch between roles

## UI Microcopy Guidelines

### Clear Action Labels
- ✅ "Offer a Ride" (not "Create Ride" or "Post Ride")
- ✅ "Find a Ride" (not "Search Rides" or "Book Ride")
- ✅ "Choose your role for this trip" (explicit per-trip context)

### Helpful Descriptions
- ✅ Include benefits: "Share your ride with others going the same way"
- ✅ Set expectations: "I have a car and can take passengers"
- ✅ Remove barriers: No mention of "commitment" or permanent roles

### Error Messages
- ✅ "Cannot book your own ride" (clear and specific)
- ✅ "Not enough seats available" (actionable feedback)
- ✅ "Please verify your email before creating rides" (clear next step)

This system creates a more intuitive, flexible, and user-friendly carpooling experience that matches real-world usage patterns.