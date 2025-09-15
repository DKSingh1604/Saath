// Dev script: reset a user's password by email
// Usage: node reset_user_password.js user@example.com newPassword

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/commute-together";

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node reset_user_password.js <email> <newPassword>");
    process.exit(1);
  }

  const [email, newPassword] = args;

  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.error("User not found:", email);
      process.exit(1);
    }

    user.password = newPassword; // model's pre-save will hash
    await user.save();

    // Fetch fresh user to get stored hashed password
    const saved = await User.findOne({ email }).select("+password");
    console.log("Password reset successful for", email);
    console.log("Stored hashed password:", saved.password);

    // verify compare
    const bcrypt = require("bcryptjs");
    const matches = await bcrypt.compare(newPassword, saved.password);
    console.log("bcrypt.compare result for provided password:", matches);
    console.log("Password reset successful for", email);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
