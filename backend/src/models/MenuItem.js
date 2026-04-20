import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ["food", "drink"], required: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

menuItemSchema.index({ name: 1, category: 1 }, { unique: true });
menuItemSchema.index({ category: 1, sortOrder: 1, createdAt: -1 });

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
