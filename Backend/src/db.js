import mongoose from "mongoose";

export async function connectDB(uri) {
  await mongoose.connect(uri, {
    autoIndex: true
  });
  console.log("✓ Mongo connected");
}
