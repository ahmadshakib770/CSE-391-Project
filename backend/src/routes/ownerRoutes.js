import { Router } from "express";
import {
  assignTask,
  closeAndCountSalesDay,
  deleteTask,
  deletePreviousDayOrders,
  deleteStaff,
  getAllOrders,
  getSalesReportAnalytics,
  getCurrentSalesDay,
  getLatestClosedSalesDay,
  getStaffById,
  getStaffList,
  getTasks,
  updateOrderStatus,
  updateStaff,
  updateStaffShift
} from "../controllers/ownerController.js";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItems,
  updateMenuItem
} from "../controllers/menuController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(requireAuth, requireRole("owner"));
router.get("/staff", getStaffList);
router.get("/staff/:staffId", getStaffById);
router.patch("/staff/:staffId", updateStaff);
router.delete("/staff/:staffId", deleteStaff);
router.patch("/staff/:staffId/shift", updateStaffShift);
router.post("/tasks", assignTask);
router.get("/tasks", getTasks);
router.delete("/tasks/:taskId", deleteTask);
router.get("/orders", getAllOrders);
router.delete("/orders/previous-day", deletePreviousDayOrders);
router.patch("/orders/:orderId/status", updateOrderStatus);
router.get("/sales-report/current", getCurrentSalesDay);
router.get("/sales-report/latest", getLatestClosedSalesDay);
router.get("/sales-report/analytics", getSalesReportAnalytics);
router.post("/sales-report/close", closeAndCountSalesDay);
router.get("/menu", getMenuItems);
router.post("/menu", createMenuItem);
router.patch("/menu/:menuItemId", updateMenuItem);
router.delete("/menu/:menuItemId", deleteMenuItem);

export default router;
