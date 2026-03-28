const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGO_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("MongoDB Connected");
      }
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    if (process.env.NODE_ENV !== "production") {
      console.error(err);
      process.exit(1);
    }
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
