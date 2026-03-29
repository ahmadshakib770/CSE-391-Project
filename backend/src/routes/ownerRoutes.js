import { Router } from "express";
import {
  assignTask,
  getStaffList,
  getTasks,
  updateStaffShift
} from "../controllers/ownerController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(requireAuth, requireRole("owner"));
router.get("/staff", getStaffList);
router.patch("/staff/:staffId/shift", updateStaffShift);
router.post("/tasks", assignTask);
router.get("/tasks", getTasks);

export default router;
