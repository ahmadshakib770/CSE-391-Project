import mongoose from "mongoose";

export const connectDb = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
  } catch (error) {
    const help = [
      "MongoDB connection failed.",
      "Check Atlas database user/password, Network Access (IP whitelist), and MONGO_URI in backend/.env.",
      `Original error: ${error.message}`
    ].join(" ");

    throw new Error(help);
  }
};
