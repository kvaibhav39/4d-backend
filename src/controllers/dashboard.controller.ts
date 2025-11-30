import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { DashboardService } from "../services/dashboard.service";

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const date = req.query.date as string | undefined;

      const stats = await dashboardService.getStats({ orgId, date });
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error", error);
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
      console.error("Dashboard bookings error", error);
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
      console.error("Dashboard recent bookings error", error);
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
      console.error("Dashboard customer returns error", error);
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
      console.error("Dashboard customer pickups error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
