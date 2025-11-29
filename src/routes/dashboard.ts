import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import {
  dashboardStatsQuerySchema,
  dashboardBookingsQuerySchema,
} from "../validators/dashboard.validator";
import { DashboardController } from "../controllers/dashboard.controller";

const router = Router();
const dashboardController = new DashboardController();

router.use(authMiddleware);

router.get(
  "/stats",
  validateQuery(dashboardStatsQuerySchema),
  (req, res) => dashboardController.getStats(req, res)
);

router.get(
  "/bookings",
  validateQuery(dashboardBookingsQuerySchema),
  (req, res) => dashboardController.getBookings(req, res)
);

export default router;

