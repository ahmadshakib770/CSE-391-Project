import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderToken: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    orderType: { type: String, enum: ["table_service", "cashier", "drive_thru"], required: true },
    customerName: { type: String, required: true, trim: true },
    tableNumber: { type: String, default: "", trim: true },
    items: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }
      }
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "digital"],
      default: "cash",
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "processing", "paid", "failed"],
      default: "unpaid"
    },
    paymentIntentId: { type: String, default: "", trim: true },
    paymentAmountMinor: { type: Number, default: 0, min: 0 },
    paymentCurrency: { type: String, default: "usd", lowercase: true, trim: true },
    paidAt: { type: Date, default: null },
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
