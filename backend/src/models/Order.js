import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderType: { type: String, enum: ["table_service", "cashier", "drive_thru"], required: true },
    customerName: { type: String, default: "", trim: true },
    tableNumber: { type: String, default: "", trim: true },
    items: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }
      }
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed"],
      default: "pending"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
