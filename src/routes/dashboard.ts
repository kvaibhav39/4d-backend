import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import {
  dashboardStatsQuerySchema,
  dashboardBookingsQuerySchema,
  dashboardRecentBookingsQuerySchema,
  dashboardCustomerPickupsQuerySchema,
  dashboardCustomerReturnsQuerySchema,
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
  "/customer-pickups",
  validateQuery(dashboardCustomerPickupsQuerySchema),
  (req, res) => dashboardController.getCustomerPickups(req, res)
);

router.get(
  "/customer-returns",
  validateQuery(dashboardCustomerReturnsQuerySchema),
  (req, res) => dashboardController.getCustomerReturns(req, res)
);

router.get("/top-products", (req, res) =>
  dashboardController.getTopProducts(req, res)
);

export default router;
