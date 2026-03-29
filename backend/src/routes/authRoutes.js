import { Router } from "express";
import {
  loginOwner,
  loginStaff,
  me,
  registerOwner,
  registerStaff
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/owner/register", registerOwner);
router.post("/owner/login", loginOwner);
router.post("/staff/register", registerStaff);
router.post("/staff/login", loginStaff);
router.get("/me", requireAuth, me);

export default router;
