import { Order } from "../models/Order.js";
import { Task } from "../models/Task.js";

export const createOrder = async (req, res, next) => {
  try {
    const { orderType, customerName, tableNumber, items } = req.body;

    const totalAmount = (items || []).reduce((sum, item) => {
      const line = Number(item.quantity || 0) * Number(item.price || 0);
      return sum + line;
    }, 0);

    const order = await Order.create({
      orderType,
      customerName,
      tableNumber,
      items,
      totalAmount,
      createdBy: req.user._id
    });

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
};

export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

export const updateMyTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, assignedTo: req.user._id },
      { status },
      { new: true }
    )
      .populate("assignedBy", "name email")
      .populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
};
