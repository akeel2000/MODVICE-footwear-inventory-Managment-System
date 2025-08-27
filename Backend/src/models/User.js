import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["Admin","Manager","Staff","Cashier","Client"], default: "Staff" },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
