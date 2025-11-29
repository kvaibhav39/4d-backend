"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const dashboardService = new dashboard_service_1.DashboardService();
class DashboardController {
    async getStats(req, res) {
        try {
            const orgId = req.user.orgId;
            const date = req.query.date;
            const stats = await dashboardService.getStats({ orgId, date });
            res.json(stats);
        }
        catch (error) {
            console.error("Dashboard stats error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getBookings(req, res) {
        try {
            const orgId = req.user.orgId;
            const date = req.query.date;
            const bookings = await dashboardService.getBookingsForDate(orgId, date);
            res.json(bookings);
        }
        catch (error) {
            console.error("Dashboard bookings error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.DashboardController = DashboardController;
