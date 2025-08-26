const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith(
        "Bearer"
      )
    ) {
      token =
        req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Access denied. No token provided.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      // Get user from token
      const user = await User.findById(
        decoded.id
      ).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Token is valid but user no longer exists",
        });
      }

      // Check if user account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

// Middleware to check if user is driver
exports.driverOnly = (req, res, next) => {
  if (!req.user.isDriver) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Driver privileges required.",
    });
  }
  next();
};

// Middleware to check if user is admin
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Admin privileges required.",
    });
  }
  next();
};

// Middleware to check ownership of resource
exports.checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(
        req.params.id
      );

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      // Check if user owns the resource
      if (
        resource.user &&
        resource.user.toString() !==
          req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You can only access your own resources.",
        });
      }

      // Check if user is the driver (for rides)
      if (
        resource.driver &&
        resource.driver.toString() !==
          req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You can only access your own rides.",
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message:
          "Server error while checking ownership",
      });
    }
  };
};

// Optional authentication middleware (doesn't fail if no token)
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith(
        "Bearer"
      )
    ) {
      token =
        req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        // Get user from token
        const user = await User.findById(
          decoded.id
        ).select("-password");

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.log(
          "Invalid token in optional auth, continuing without user"
        );
      }
    }

    next();
  } catch (error) {
    console.error(error);
    next(); // Continue without user
  }
};

// Generate JWT Token
exports.generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
};
