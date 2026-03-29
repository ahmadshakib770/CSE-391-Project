import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    daysPerWeek: { type: Number, default: 6, min: 1, max: 7 },
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "17:00" }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "staff"], required: true },
    shift: { type: shiftSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
