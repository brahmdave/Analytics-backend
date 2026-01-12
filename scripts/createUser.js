require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/database");

const createUser = async () => {
  try {
    await connectDB();
    
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.error("Usage: node scripts/createUser.js <email> <password>");
      process.exit(1);
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.error("User with this email already exists");
      process.exit(1);
    }
    
    const user = new User({
      email: email.toLowerCase(),
      password: password,
    });
    
    await user.save();
    console.log(`User created successfully: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating user:", error);
    process.exit(1);
  }
};

createUser();

