import { Router } from "express";
import {
  confirmMyOrderPayment,
  createOrder,
  createMyOrderCheckoutSession,
  createMyOrderPaymentIntent,
  getAvailableMenuItems,
  getMyOrders,
  getMyTasks,
  updateMyOrderStatus,
  updateMyTaskStatus,
  verifyMyOrderCheckoutSession
} from "../controllers/staffController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(requireAuth, requireRole("staff"));
router.get("/menu", getAvailableMenuItems);
router.post("/orders", createOrder);
router.get("/orders", getMyOrders);
router.patch("/orders/:orderId/status", updateMyOrderStatus);
router.post("/orders/:orderId/checkout-session", createMyOrderCheckoutSession);
router.post("/orders/:orderId/checkout-verify", verifyMyOrderCheckoutSession);
router.post("/orders/:orderId/payment-intent", createMyOrderPaymentIntent);
router.post("/orders/:orderId/payment-confirm", confirmMyOrderPayment);
router.get("/tasks", getMyTasks);
router.patch("/tasks/:taskId", updateMyTaskStatus);

export default router;
