<div align="center">
  <img src="./assets/logos/logo.png" alt="CommuteTogether Logo" width="400"/>
</div>


# Saath - a Community Car Pool App

A modern carpooling application where users choose their role (driver or passenger) for each individual trip, rather than having a fixed role during registration.

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### Flutter App Setup  
```bash
flutter pub get
flutter run
```

## 🏗️ Architecture Overview

### Per-Ride Role Selection
- ✅ **Home Screen**: Users choose "Offer a Ride" (driver) or "Find a Ride" (passenger) for each trip
- ✅ **Minimal Registration**: Only essential fields (name, email, phone, city, password)
- ✅ **Flexible Usage**: Same user can be driver today, passenger tomorrow
- ✅ **Per-Ride Vehicle Info**: Vehicle details provided when creating ride, not stored in user profile

### Key Features
- 🔐 **JWT Authentication** with email verification
- 📧 **Mailgun Integration** for transactional emails  
- 🗺️ **Location-Based Matching** with coordinates
- 💰 **Dynamic Pricing** per seat
- 💬 **Real-Time Chat** for ride coordination
- ⭐ **Rating System** for drivers and passengers
- 🔒 **Comprehensive Validation** and security

## 📁 Project Structure

```
car_pool_app/
├── backend/                 # Node.js Express API
│   ├── models/             # MongoDB schemas
│   │   ├── User.js         # User model (minimal, no driver fields)
│   │   ├── Ride.js         # Ride model with per-ride vehicle info
│   │   └── Chat.js         # Chat/messaging
│   ├── routes/             # API endpoints
│   │   ├── auth.js         # Authentication (minimal registration)
│   │   ├── rides.js        # Ride creation & booking
│   │   └── users.js        # User management
│   ├── middleware/         # Auth, validation, error handling
│   ├── utils/              # Mailgun, helpers
│   ├── tests/              # Test suites
│   └── scripts/            # Dev utilities
├── lib/                    # Flutter app
│   ├── screens/            # UI screens
│   │   ├── home_screen.dart          # Role selection home
│   │   ├── auth/                     # Authentication flows
│   │   │   ├── register_screen.dart  # Minimal registration
│   │   │   └── login_screen.dart     # Login
│   │   └── rides/                    # Ride management
│   │       ├── post_ride_screen.dart # Create ride (driver)
│   │       └── find_rides_screen.dart # Search rides (passenger)
│   ├── models/             # Data models
│   ├── services/           # API services
│   └── widgets/            # Reusable components
└── docs/                   # Documentation
    └── PER_RIDE_ROLES.md   # Detailed system documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Minimal user registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/resend-otp` - Resend verification code

### Rides
- `POST /api/rides` - Create ride (driver role, includes vehicle info)
- `GET /api/rides` - Search available rides
- `POST /api/rides/:id/book` - Book ride (passenger role)
- `GET /api/rides/:id` - Get ride details

### Users  
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
```

### Test Coverage
- ✅ Ride creation with per-ride vehicle info
- ✅ Passenger booking validation  
- ✅ Edge cases (own ride booking, insufficient seats, etc.)
- ✅ Minimal registration flow
- ✅ User role flexibility

### Flutter Tests
```bash
flutter test
```

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
```

## 🚀 Deployment

### Backend (Node.js)
- Deploy to Heroku, Railway, or similar
- Set environment variables
- Ensure MongoDB Atlas connection

### Flutter App
- Build for iOS: `flutter build ios`
- Build for Android: `flutter build apk`
- Deploy to App Store / Play Store

## 🎯 Key Benefits

### User Experience
- **Simple onboarding**: Quick registration without role commitment
- **Real-world flexibility**: Match actual carpooling usage patterns  
- **Lower barriers**: No need to decide "am I a driver?" upfront

### Technical
- **Clean data model**: No legacy driver fields in user profiles
- **Better scalability**: Per-ride context for vehicle/preferences
- **Easier maintenance**: Single user type, role chosen per action

### Business
- **Higher conversion**: Simpler registration increases signups
- **Increased engagement**: Users participate in multiple ways
- **Better retention**: Not limited by initial role selection

## 🔄 Migration from Fixed-Role Systems

If migrating from a system with fixed driver/passenger roles:

1. **Database**: Remove `isDriver`, `vehicle`, `preferences` from user schema
2. **Registration**: Update to collect only essential fields
3. **UI Flow**: Replace role-based navigation with per-ride selection  
4. **API**: Update ride creation to accept vehicle info in request
5. **Testing**: Ensure users can switch between roles seamlessly

## 📖 Documentation

- [Per-Ride Roles System](./docs/PER_RIDE_ROLES.md) - Detailed technical documentation
- API Documentation - Complete API reference (coming soon)
- Deployment Guide - Production deployment steps (coming soon)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for flexible, user-friendly carpooling**
