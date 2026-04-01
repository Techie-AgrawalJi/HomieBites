import mongoose from 'mongoose';

let isConnected = false;
let connectPromise: Promise<void> | null = null;

const connectDB = async (retries = 10, delay = 2000): Promise<void> => {
  if (isConnected) return;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      isConnected = true;
      return;
    } catch (error: any) {
      console.error(`MongoDB connection attempt ${i + 1}/${retries} failed: ${error.message}`);
      if (i === retries - 1) {
        connectPromise = null;
        throw error;
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  })();

  return connectPromise;
};

export default connectDB;
