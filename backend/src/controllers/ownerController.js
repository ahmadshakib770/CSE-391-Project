import { Order } from "../models/Order.js";
import { SalesDayReport } from "../models/SalesDayReport.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";

const ORDER_STATUS_STAGES = ["pending", "preparing", "ready", "completed"];

const getNextOrderStatus = (status) => {
  const currentIndex = ORDER_STATUS_STAGES.indexOf(status);
  if (currentIndex === -1) return null;
  return ORDER_STATUS_STAGES[currentIndex + 1] || null;
};

const getCurrentBusinessDayStart = async () => {
  const lastClosedReport = await SalesDayReport.findOne()
    .sort({ periodEnd: -1 })
    .select("periodEnd");

  if (lastClosedReport?.periodEnd) {
    return lastClosedReport.periodEnd;
  }

  const firstOrder = await Order.findOne().sort({ createdAt: 1 }).select("createdAt");
  return firstOrder?.createdAt || new Date();
};

const getOrdersWithinRange = async (periodStart, periodEnd) => {
  return Order.find({
    createdAt: {
      $gte: periodStart,
      $lt: periodEnd
    }
  }).sort({ createdAt: -1 });
};

const buildTopItems = (orders) => {
  const counter = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const normalizedKey = String(item.name || "").trim().toLowerCase();
      if (!normalizedKey) continue;

      const existing = counter.get(normalizedKey);
      const nextQuantity = Number(item.quantity || 0) + Number(existing?.quantity || 0);

      counter.set(normalizedKey, {
        name: existing?.name || String(item.name).trim(),
        quantity: nextQuantity
      });
    }
  }

  return [...counter.values()]
    .sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 3);
};

const buildSalesMetrics = (orders, expenseAmount = 0) => {
  const revenue = orders.reduce((sum, order) => {
    if (order.paymentStatus === "paid") {
      return sum + Number(order.totalAmount || 0);
    }

    return sum;
  }, 0);

  const expenses = Number(expenseAmount || 0);
  const profit = revenue - expenses;

  return {
    revenue,
    expenses,
    profit,
    totalOrders: orders.length,
    topItems: buildTopItems(orders)
  };
};

export const getStaffList = async (_req, res, next) => {
  try {
    const staff = await User.find({ role: "staff" }).select("name email shift createdAt").sort({ createdAt: -1 });
    res.json({ staff });
  } catch (error) {
    next(error);
  }
};

export const getStaffById = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const staff = await User.findOne({ _id: staffId, role: "staff" }).select("name email shift createdAt");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json({ staff });
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { name, email, shift } = req.body;

    const update = {
      name,
      email,
      shift
    };

    const staff = await User.findOneAndUpdate(
      { _id: staffId, role: "staff" },
      update,
      { new: true, runValidators: true }
    ).select("name email shift createdAt");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json({ staff });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }

    next(error);
  }
};

export const deleteStaff = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const staff = await User.findOneAndDelete({ _id: staffId, role: "staff" });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    await Task.deleteMany({ assignedTo: staffId });

    res.json({ message: "Staff deleted" });
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

    const assignedToList = Array.isArray(assignedTo)
      ? assignedTo.filter(Boolean)
      : assignedTo
        ? [assignedTo]
        : [];

    if (assignedToList.length === 0) {
      return res.status(400).json({ message: "Select at least one staff member" });
    }

    const staffMembers = await User.find({ _id: { $in: assignedToList }, role: "staff" }).select("_id");
    const foundIds = new Set(staffMembers.map((member) => String(member._id)));
    const hasInvalid = assignedToList.some((id) => !foundIds.has(String(id)));

    if (hasInvalid) {
      return res.status(400).json({ message: "One or more selected staff are invalid" });
    }

    const tasks = await Task.insertMany(
      assignedToList.map((staffId) => ({
        title,
        details,
        assignedTo: staffId,
        assignedBy: req.user._id,
        dueDate
      }))
    );

    res.status(201).json({ tasks });
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

export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task deleted",
      deletedTaskId: task._id
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (_req, res, next) => {
  try {
    const currentDayStart = await getCurrentBusinessDayStart();
    const orders = await Order.find().sort({ createdAt: -1 }).lean();

    const mappedOrders = orders.map((order) => ({
      ...order,
      isPreviousDay: new Date(order.createdAt) < currentDayStart
    }));

    const previousDayOrderCount = mappedOrders.filter((order) => order.isPreviousDay).length;

    res.json({
      orders: mappedOrders,
      currentDayStart,
      previousDayOrderCount
    });
  } catch (error) {
    next(error);
  }
};

export const deletePreviousDayOrders = async (_req, res, next) => {
  try {
    const currentDayStart = await getCurrentBusinessDayStart();

    const result = await Order.deleteMany({
      createdAt: {
        $lt: currentDayStart
      }
    });

    res.json({
      message: "Previous day orders deleted",
      deletedCount: result.deletedCount || 0,
      currentDayStart
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const nextStatus = getNextOrderStatus(order.status);

    if (!nextStatus) {
      return res.status(400).json({ message: "Order is already completed" });
    }

    if (status && status !== nextStatus) {
      return res.status(400).json({
        message: `Invalid status transition. Next stage must be ${nextStatus}`
      });
    }

    order.status = nextStatus;
    await order.save();

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

export const getCurrentSalesDay = async (_req, res, next) => {
  try {
    const periodStart = await getCurrentBusinessDayStart();
    const periodEnd = new Date();
    const orders = await getOrdersWithinRange(periodStart, periodEnd);
    const metrics = buildSalesMetrics(orders, 0);

    res.json({
      day: {
        periodStart,
        periodEnd,
        revenue: metrics.revenue,
        totalOrders: metrics.totalOrders,
        topItems: metrics.topItems
      }
    });
  } catch (error) {
    next(error);
  }
};

export const closeAndCountSalesDay = async (req, res, next) => {
  try {
    const expenseAmount = Number(req.body?.expenseAmount || 0);
    const expenseNotes = String(req.body?.expenseNotes || "").trim();

    if (Number.isNaN(expenseAmount) || expenseAmount < 0) {
      return res.status(400).json({ message: "Expense amount must be a valid non-negative number" });
    }

    const periodStart = await getCurrentBusinessDayStart();
    const periodEnd = new Date();
    const orders = await getOrdersWithinRange(periodStart, periodEnd);
    const metrics = buildSalesMetrics(orders, expenseAmount);

    const report = await SalesDayReport.create({
      periodStart,
      periodEnd,
      expenseAmount,
      expenseNotes,
      revenue: metrics.revenue,
      profit: metrics.profit,
      totalOrders: metrics.totalOrders,
      topItems: metrics.topItems,
      orderIds: orders.map((order) => order._id),
      closedBy: req.user._id
    });

    res.status(201).json({ report, orders });
  } catch (error) {
    next(error);
  }
};

export const getLatestClosedSalesDay = async (_req, res, next) => {
  try {
    const report = await SalesDayReport.findOne().sort({ periodEnd: -1 });

    if (!report) {
      return res.json({ report: null, orders: [] });
    }

    const orders = await Order.find({ _id: { $in: report.orderIds || [] } }).sort({ createdAt: -1 });

    res.json({ report, orders });
  } catch (error) {
    next(error);
  }
};

export const getSalesReportAnalytics = async (_req, res, next) => {
  try {
    const reports = await SalesDayReport.find()
      .sort({ periodEnd: 1 })
      .select("periodStart periodEnd revenue expenseAmount profit totalOrders");

    const analyticsDays = reports.map((report, index) => {
      const previousReport = index > 0 ? reports[index - 1] : null;
      const currentProfit = Number(report.profit || 0);
      const previousProfit = Number(previousReport?.profit || 0);
      const profitChange = previousReport ? currentProfit - previousProfit : 0;

      let profitTrend = "same";
      if (!previousReport) {
        profitTrend = "no_previous";
      } else if (profitChange > 0) {
        profitTrend = "increased";
      } else if (profitChange < 0) {
        profitTrend = "decreased";
      }

      return {
        reportId: report._id,
        dayNumber: index + 1,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        revenue: Number(report.revenue || 0),
        expenseAmount: Number(report.expenseAmount || 0),
        profit: currentProfit,
        totalOrders: Number(report.totalOrders || 0),
        profitTrend,
        profitChangeFromPreviousDay: profitChange
      };
    });

    res.json({ analyticsDays: analyticsDays.reverse() });
  } catch (error) {
    next(error);
  }
};
