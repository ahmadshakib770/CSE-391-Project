import { Router } from "express";
import {
  createOrder,
  getMyTasks,
  updateMyTaskStatus
} from "../controllers/staffController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(requireAuth, requireRole("staff"));
router.post("/orders", createOrder);
router.get("/tasks", getMyTasks);
router.patch("/tasks/:taskId", updateMyTaskStatus);

export default router;
