const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // MongoDB Atlas connection string
    // Load environment variables from .env file
    // 1. Create a `.env` file in your project root if it doesn't exist.
    // 2. Add this line to the file: MONGODB_URI=your-mongodb-connection-string
    require("dotenv").config();
    const mongoURI = process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;

