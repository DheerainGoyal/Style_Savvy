import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stylesavvy';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`MongoDB Notice: ${err.message}`);
    console.warn('⚡ Running with graceful fallback mode so dev server & demo never crash.');
  }
};

export default connectDB;
