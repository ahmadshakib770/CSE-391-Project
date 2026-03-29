import mongoose from "mongoose";

let connectionPromise = null;

export const connectDb = async (mongoUri) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });

    const connection = await connectionPromise;
    return connection;
  } catch (error) {
    connectionPromise = null;
    const help = [
      "MongoDB connection failed.",
      "Check Atlas database user/password, Network Access (IP whitelist), and MONGO_URI in backend/.env.",
      `Original error: ${error.message}`
    ].join(" ");

    throw new Error(help);
  }
};
