import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import {
  dashboardStatsQuerySchema,
  dashboardBookingsQuerySchema,
  dashboardRecentBookingsQuerySchema,
  dashboardUpcomingBookingsQuerySchema,
  dashboardReadyForPickupBookingsQuerySchema,
} from "../validators/dashboard.validator";
import { DashboardController } from "../controllers/dashboard.controller";

const router = Router();
const dashboardController = new DashboardController();

router.use(authMiddleware);

router.get("/stats", validateQuery(dashboardStatsQuerySchema), (req, res) =>
  dashboardController.getStats(req, res)
);

router.get(
  "/bookings",
  validateQuery(dashboardBookingsQuerySchema),
  (req, res) => dashboardController.getBookings(req, res)
);

router.get(
  "/recent-bookings",
  validateQuery(dashboardRecentBookingsQuerySchema),
  (req, res) => dashboardController.getRecentBookings(req, res)
);

router.get(
  "/upcoming-bookings",
  validateQuery(dashboardUpcomingBookingsQuerySchema),
  (req, res) => dashboardController.getUpcomingBookings(req, res)
);

router.get(
  "/ready-for-pickup",
  validateQuery(dashboardReadyForPickupBookingsQuerySchema),
  (req, res) => dashboardController.getReadyForPickupBookings(req, res)
);

export default router;
