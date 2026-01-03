import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { DashboardService } from "../services/dashboard.service";
import { logError } from "../utils/logger";

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const date = req.query.date as string | undefined;

      const stats = await dashboardService.getStats({ orgId, date });
      res.json(stats);
    } catch (error) {
      logError("Dashboard stats error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getBookings(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const date = req.query.date as string | undefined;

      const bookings = await dashboardService.getBookingsForDate(orgId, date);
      res.json(bookings);
    } catch (error) {
      logError("Dashboard bookings error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getRecentBookings(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const days = req.query.days ? parseInt(req.query.days as string) : 5;

      const bookings = await dashboardService.getRecentBookings(orgId, days);
      res.json(bookings);
    } catch (error) {
      logError("Dashboard recent bookings error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getCustomerReturns(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const days = req.query.days ? parseInt(req.query.days as string) : 7;

      const bookings = await dashboardService.getCustomerReturns(orgId, days);
      res.json(bookings);
    } catch (error) {
      logError("Dashboard customer returns error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getCustomerPickups(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const days = req.query.days ? parseInt(req.query.days as string) : 7;

      const bookings = await dashboardService.getCustomerPickups(orgId, days);
      res.json(bookings);
    } catch (error) {
      logError("Dashboard customer pickups error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getTopProducts(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      const topProducts = await dashboardService.getTopProducts(orgId, limit);
      res.json(topProducts);
    } catch (error) {
      logError("Dashboard top products error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
