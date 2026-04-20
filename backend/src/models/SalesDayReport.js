import mongoose from "mongoose";

const salesDayReportSchema = new mongoose.Schema(
  {
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    expenseAmount: { type: Number, required: true, min: 0, default: 0 },
    expenseNotes: { type: String, default: "", trim: true },
    revenue: { type: Number, required: true, min: 0, default: 0 },
    profit: { type: Number, required: true, default: 0 },
    totalOrders: { type: Number, required: true, min: 0, default: 0 },
    topItems: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 }
      }
    ],
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

salesDayReportSchema.index({ periodEnd: -1 });

export const SalesDayReport = mongoose.model("SalesDayReport", salesDayReportSchema);
