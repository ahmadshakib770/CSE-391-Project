import { Task } from "../models/Task.js";
import { User } from "../models/User.js";

export const getStaffList = async (_req, res, next) => {
  try {
    const staff = await User.find({ role: "staff" }).select("name email shift createdAt").sort({ createdAt: -1 });
    res.json({ staff });
  } catch (error) {
    next(error);
  }
};

export const updateStaffShift = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { daysPerWeek, startTime, endTime } = req.body;

    const staff = await User.findOneAndUpdate(
      { _id: staffId, role: "staff" },
      { shift: { daysPerWeek, startTime, endTime } },
      { new: true }
    ).select("name email shift");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json({ staff });
  } catch (error) {
    next(error);
  }
};

export const assignTask = async (req, res, next) => {
  try {
    const { title, details, assignedTo, dueDate } = req.body;

    const staff = await User.findOne({ _id: assignedTo, role: "staff" });
    if (!staff) {
      return res.status(400).json({ message: "Invalid staff member" });
    }

    const task = await Task.create({
      title,
      details,
      assignedTo,
      assignedBy: req.user._id,
      dueDate
    });

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (_req, res, next) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};
