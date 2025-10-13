const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cookieParser()); // Parse cookies

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// CORS configuration - Allow all origins in development
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? ["https://your-frontend-domain.com"] : true, // Allow all origins in development
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/driver", require("./routes/userAsDriver"));
app.use("/api/passenger", require("./routes/userAsPassenger"));
app.use("/api/users", require("./routes/users"));
app.use("/api/rides", require("./routes/rides"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/chat", require("./routes/chat"));

app.use(require("./middleware/errorHandler"));

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/commute-together";

// Connect to MongoDB with enhanced options
// Set up Mongoose connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from MongoDB");
});

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // Timeout for server selection
    socketTimeoutMS: 45000, // How long sockets stay open for
    connectTimeoutMS: 20000, // How long to wait for connect
    maxPoolSize: 10, // Maximum number of connections in the connection pool
  })
  .then(() => {
    console.log("🚀 Connected to MongoDB");

    const server = app.listen(PORT, () => {
      console.log(`🌟 Server running on port ${PORT}....`);
    });

    const io = require("socket.io")(server, {
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? ["https://your-frontend-domain.com"]
            : true, // Allow all origins in development
        credentials: true,
      },
    });

    require("./socket/chatSocket")(io);
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("👋 SIGTERM received, shutting down gracefully");
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("👋 SIGINT received, shutting down gracefully");
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
    process.exit(1);
  }
});
