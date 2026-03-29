import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    details: { type: String, default: "", trim: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "in_progress", "done"], default: "pending" },
    dueDate: { type: Date, required: true }
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
