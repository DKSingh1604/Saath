const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const app = require("../server"); // assuming server exports the app
const User = require("../models/User");
const Ride = require("../models/Ride");

// Test database connection
const MONGODB_URI =
  process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/car_pool_test";

describe("Per-Ride Role System", () => {
  let userToken1, userToken2, user1, user2;

  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Ride.deleteMany({});

    // Create test users
    const hashedPassword = await bcrypt.hash("password123", 12);

    user1 = await User.create({
      name: "Driver User",
      email: "driver@test.com",
      phone: "+1234567890",
      password: hashedPassword,
      city: "Test City",
      isVerified: { email: true },
    });

    user2 = await User.create({
      name: "Passenger User",
      email: "passenger@test.com",
      phone: "+1234567891",
      password: hashedPassword,
      city: "Test City",
      isVerified: { email: true },
    });

    // Get auth tokens
    const loginRes1 = await request(app).post("/api/auth/login").send({
      email: "driver@test.com",
      password: "password123",
    });
    userToken1 = loginRes1.body.data.token;

    const loginRes2 = await request(app).post("/api/auth/login").send({
      email: "passenger@test.com",
      password: "password123",
    });
    userToken2 = loginRes2.body.data.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/rides - Create Ride as Driver", () => {
    test("should create ride with vehicle info provided per-ride", async () => {
      const rideData = {
        origin: {
          address: "123 Start St, Test City",
          coordinates: [-73.935242, 40.73061],
          city: "Test City",
        },
        destination: {
          address: "456 End Ave, Test City",
          coordinates: [-73.935242, 40.73561],
          city: "Test City",
        },
        departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        availableSeats: 3,
        pricePerSeat: 15.5,
        vehicleInfo: {
          make: "Toyota",
          model: "Camry",
          color: "Blue",
          plateNumber: "ABC123",
        },
        route: {
          distance: 25,
          duration: 45,
        },
      };

      const res = await request(app)
        .post("/api/rides")
        .set("Authorization", `Bearer ${userToken1}`)
        .send(rideData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.driver).toBe(user1._id.toString());
      expect(res.body.data.vehicleInfo.make).toBe("Toyota");
      expect(res.body.data.vehicleInfo.plateNumber).toBe("ABC123");
    });

    test("should reject ride creation without vehicle info", async () => {
      const rideData = {
        origin: {
          address: "123 Start St, Test City",
          coordinates: [-73.935242, 40.73061],
          city: "Test City",
        },
        destination: {
          address: "456 End Ave, Test City",
          coordinates: [-73.935242, 40.73561],
          city: "Test City",
        },
        departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        availableSeats: 3,
        pricePerSeat: 15.5,
        // Missing vehicleInfo
        route: {
          distance: 25,
          duration: 45,
        },
      };

      const res = await request(app)
        .post("/api/rides")
        .set("Authorization", `Bearer ${userToken1}`)
        .send(rideData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("should update user totalRides.asDriver after ride creation", async () => {
      const rideData = {
        origin: {
          address: "123 Start St, Test City",
          coordinates: [-73.935242, 40.73061],
          city: "Test City",
        },
        destination: {
          address: "456 End Ave, Test City",
          coordinates: [-73.935242, 40.73561],
          city: "Test City",
        },
        departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        availableSeats: 3,
        pricePerSeat: 15.5,
        vehicleInfo: {
          make: "Honda",
          model: "Civic",
          color: "Red",
          plateNumber: "XYZ789",
        },
        route: {
          distance: 25,
          duration: 45,
        },
      };

      await request(app)
        .post("/api/rides")
        .set("Authorization", `Bearer ${userToken1}`)
        .send(rideData);

      const updatedUser = await User.findById(user1._id);
      expect(updatedUser.totalRides.asDriver).toBe(1);
    });
  });

  describe("POST /api/rides/:id/book - Book Ride as Passenger", () => {
    let rideId;

    beforeEach(async () => {
      // Create a ride by user1
      const ride = await Ride.create({
        driver: user1._id,
        origin: {
          address: "123 Start St, Test City",
          coordinates: [-73.935242, 40.73061],
          city: "Test City",
        },
        destination: {
          address: "456 End Ave, Test City",
          coordinates: [-73.935242, 40.73561],
          city: "Test City",
        },
        departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        availableSeats: 3,
        pricePerSeat: 15.5,
        vehicleInfo: {
          make: "Toyota",
          model: "Camry",
          color: "Blue",
          plateNumber: "ABC123",
        },
        route: {
          distance: 25,
          duration: 45,
        },
      });
      rideId = ride._id;
    });

    test("should allow passenger to book available ride", async () => {
      const bookingData = {
        seatsBooked: 2,
      };

      const res = await request(app)
        .post(`/api/rides/${rideId}/book`)
        .set("Authorization", `Bearer ${userToken2}`)
        .send(bookingData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.passengers).toHaveLength(1);
      expect(res.body.data.passengers[0].user).toBe(user2._id.toString());
      expect(res.body.data.passengers[0].seatsBooked).toBe(2);
    });

    test("should prevent driver from booking own ride", async () => {
      const bookingData = {
        seatsBooked: 1,
      };

      const res = await request(app)
        .post(`/api/rides/${rideId}/book`)
        .set("Authorization", `Bearer ${userToken1}`)
        .send(bookingData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Cannot book your own ride");
    });

    test("should prevent booking more seats than available", async () => {
      const bookingData = {
        seatsBooked: 5, // More than the 3 available seats
      };

      const res = await request(app)
        .post(`/api/rides/${rideId}/book`)
        .set("Authorization", `Bearer ${userToken2}`)
        .send(bookingData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Not enough seats available");
    });

    test("should prevent double booking by same user", async () => {
      // First booking
      await request(app)
        .post(`/api/rides/${rideId}/book`)
        .set("Authorization", `Bearer ${userToken2}`)
        .send({ seatsBooked: 1 });

      // Attempt second booking
      const res = await request(app)
        .post(`/api/rides/${rideId}/book`)
        .set("Authorization", `Bearer ${userToken2}`)
        .send({ seatsBooked: 1 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Already booked this ride");
    });

    test("should update user totalRides.asPassenger after booking", async () => {
      const bookingData = {
        seatsBooked: 1,
      };

      await request(app)
        .post(`/api/rides/${rideId}/book`)
        .set("Authorization", `Bearer ${userToken2}`)
        .send(bookingData);

      const updatedUser = await User.findById(user2._id);
      expect(updatedUser.totalRides.asPassenger).toBe(1);
    });

    test("should calculate total amount correctly", async () => {
      const bookingData = {
        seatsBooked: 2,
      };

      const res = await request(app)
        .post(`/api/rides/${rideId}/book`)
        .set("Authorization", `Bearer ${userToken2}`)
        .send(bookingData);

      expect(res.body.data.passengers[0].totalAmount).toBe(31.0); // 2 seats * $15.50
    });
  });

  describe("Registration - Minimal Fields Only", () => {
    test("should register user without driver-specific fields", async () => {
      const userData = {
        name: "Test User",
        email: "newuser@test.com",
        phone: "+1234567892",
        password: "password123",
        city: "Test City",
        gender: "male",
        dateOfBirth: "1990-01-01",
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Test User");
      expect(res.body.data.email).toBe("newuser@test.com");

      // Verify user was created without driver fields
      const user = await User.findOne({ email: "newuser@test.com" });
      expect(user.name).toBe("Test User");
      expect(user.gender).toBe("male");
      expect(user.isVerified.email).toBe(false); // Should require verification
    });

    test("should accept minimal required fields only", async () => {
      const userData = {
        name: "Minimal User",
        email: "minimal@test.com",
        phone: "+1234567893",
        password: "password123",
        city: "Test City",
        // No optional fields
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe("User Model - Clean Schema", () => {
    test("should not have driver-specific fields in user model", () => {
      const userSchema = User.schema.paths;

      // Should not have these driver-specific fields
      expect(userSchema.isDriver).toBeUndefined();
      expect(userSchema.vehicle).toBeUndefined();
      expect(userSchema.drivingLicense).toBeUndefined();
      expect(userSchema.preferences).toBeUndefined();

      // Should have basic fields
      expect(userSchema.name).toBeDefined();
      expect(userSchema.email).toBeDefined();
      expect(userSchema.phone).toBeDefined();
      expect(userSchema.city).toBeDefined();
      expect(userSchema.totalRides).toBeDefined();
    });
  });
});

module.exports = {
  testDb: MONGODB_URI,
};
