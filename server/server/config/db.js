import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/supportgpt';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log(`[SupportGPT DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[SupportGPT DB Error] ${error.message}`);
    console.warn('[SupportGPT DB] Continuing without MongoDB connection. API will run in degraded mode.');
  }
};

export default connectDB;
