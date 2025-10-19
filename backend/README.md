<div align="center">
  <img src="./assets/logos/logo.png" alt="CommuteTogether Logo" width="200"/>
</div>

# CommuteTogether Backend API

A comprehensive Node.js backend API for the CommuteTogether ride-sharing application built with Express.js, MongoDB, and Socket.IO for real-time features.

## 🚀 Features

### Authentication & Security
- JWT-based authentication
- Email verification with OTP
- Password reset functionality
- Rate limiting for sensitive endpoints
- Input validation and sanitization
- Secure password hashing with bcrypt

### User Management
- Complete user profiles with ratings
- Vehicle information for drivers
- Profile picture upload
- Verification system (email, phone, identity, license)

### Ride Management
- Create and manage rides
- Search rides with filters (location, date, price, seats)
- Advanced booking system
- Ride status management
- Recurring rides support
- Geospatial queries for location-based search

### Real-time Chat
- Socket.IO integration for real-time messaging
- Chat rooms for each ride
- Message read receipts
- Typing indicators
- Location sharing
- Push notifications support

### Review System
- Comprehensive review system
- Multi-criteria ratings
- Review validation and moderation
- Helpful vote system

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - MongoDB connection string
   - JWT secret
   - Email configuration
   - Other settings

4. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

5. **Run the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/verify-email` | Verify email with OTP | No |
| POST | `/api/auth/resend-otp` | Resend OTP | No |
| POST | `/api/auth/forgot-password` | Send password reset link | No |
| PUT | `/api/auth/reset-password/:token` | Reset password | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/me` | Update user profile | Yes |
| PUT | `/api/auth/update-password` | Update password | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/users/:id` | Get user profile | Optional |
| POST | `/api/users/upload-avatar` | Upload profile picture | Yes |
| PUT | `/api/users/vehicle` | Update vehicle info | Yes |
| GET | `/api/users/search` | Search users | Yes |

### Ride Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/rides` | Get rides with filters | Yes |
| GET | `/api/rides/:id` | Get single ride | Yes |
| POST | `/api/rides` | Create new ride | Yes |
| PUT | `/api/rides/:id` | Update ride | Yes |
| DELETE | `/api/rides/:id` | Cancel/Delete ride | Yes |
| POST | `/api/rides/:id/book` | Book a ride | Yes |
| DELETE | `/api/rides/:id/cancel-booking` | Cancel booking | Yes |
| GET | `/api/rides/my/rides` | Get user's rides | Yes |

### Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/bookings` | Get user bookings | Yes |
| GET | `/api/bookings/:rideId` | Get booking details | Yes |
| PUT | `/api/bookings/:rideId/:passengerId/status` | Update booking status | Yes |

### Review Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/reviews` | Create review | Yes |
| GET | `/api/reviews/user/:userId` | Get user reviews | No |
| GET | `/api/reviews/ride/:rideId` | Get ride reviews | Yes |
| PUT | `/api/reviews/:id` | Update review | Yes |
| DELETE | `/api/reviews/:id` | Delete review | Yes |
| POST | `/api/reviews/:id/helpful` | Add helpful vote | Yes |
| DELETE | `/api/reviews/:id/helpful` | Remove helpful vote | Yes |

### Chat Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/chat` | Get user's chat list | Yes |
| GET | `/api/chat/ride/:rideId` | Get ride chat | Yes |
| GET | `/api/chat/:chatId/messages` | Get chat messages | Yes |
| POST | `/api/chat/:chatId/messages` | Send message | Yes |
| PUT | `/api/chat/:chatId/read` | Mark messages as read | Yes |

## 🌐 Socket.IO Events

### Client to Server Events
- `join_chat` - Join a chat room
- `leave_chat` - Leave a chat room
- `send_message` - Send a message
- `mark_read` - Mark messages as read
- `typing` - Typing indicator
- `share_location` - Share location

### Server to Client Events
- `joined_chat` - Successfully joined chat
- `left_chat` - Successfully left chat
- `new_message` - New message received
- `messages_read` - Messages marked as read
- `user_typing` - User typing indicator
- `location_shared` - Location shared
- `ride_notification` - Ride updates
- `error` - Error messages

## 📊 Database Schema

### User Schema
- Personal information (name, email, phone, city)
- Vehicle information (for drivers)
- Ratings and verification status
- Preferences and settings

### Ride Schema
- Route information (origin, destination, waypoints)
- Timing and pricing
- Passenger management
- Preferences and notes

### Chat Schema
- Participants and messages
- Read receipts and status
- Message types (text, image, location, system)

### Review Schema
- Multi-criteria ratings
- Comments and tags
- Helpful votes and moderation

## 🔒 Security Features

- **Authentication**: JWT tokens with expiration
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Comprehensive validation using express-validator
- **Password Security**: Bcrypt hashing with salt
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers
- **File Upload**: Secure multer configuration

## 📦 Dependencies

### Core Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `socket.io` - Real-time communication
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `multer` - File upload handling

### Security & Validation
- `helmet` - Security headers
- `cors` - Cross-origin resource sharing
- `express-rate-limit` - Rate limiting
- `express-validator` - Input validation

### Development Tools
- `nodemon` - Auto-restart during development
- `jest` - Testing framework
- `dotenv` - Environment variable management

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up process manager (PM2)

### Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_super_secret_jwt_key
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

## 📝 Development Guidelines

### Code Structure
```
backend/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── socket/          # Socket.IO handlers
├── uploads/         # File uploads directory
├── server.js        # Main server file
├── package.json     # Dependencies
└── .env.example     # Environment template
```

### API Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📧 Contact

For questions or support, please contact the CommuteTogether team.

---

**Built with ❤️ by the CommuteTogether Team**