"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const errorLogger_1 = require("../utils/errorLogger");
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
            (0, errorLogger_1.logError)("Dashboard stats error", error);
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
            (0, errorLogger_1.logError)("Dashboard bookings error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getRecentBookings(req, res) {
        try {
            const orgId = req.user.orgId;
            const days = req.query.days ? parseInt(req.query.days) : 5;
            const bookings = await dashboardService.getRecentBookings(orgId, days);
            res.json(bookings);
        }
        catch (error) {
            (0, errorLogger_1.logError)("Dashboard recent bookings error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getCustomerReturns(req, res) {
        try {
            const orgId = req.user.orgId;
            const days = req.query.days ? parseInt(req.query.days) : 7;
            const bookings = await dashboardService.getCustomerReturns(orgId, days);
            res.json(bookings);
        }
        catch (error) {
            (0, errorLogger_1.logError)("Dashboard customer returns error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getCustomerPickups(req, res) {
        try {
            const orgId = req.user.orgId;
            const days = req.query.days ? parseInt(req.query.days) : 7;
            const bookings = await dashboardService.getCustomerPickups(orgId, days);
            res.json(bookings);
        }
        catch (error) {
            (0, errorLogger_1.logError)("Dashboard customer pickups error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getTopProducts(req, res) {
        try {
            const orgId = req.user.orgId;
            const limit = req.query.limit ? parseInt(req.query.limit) : 5;
            const topProducts = await dashboardService.getTopProducts(orgId, limit);
            res.json(topProducts);
        }
        catch (error) {
            (0, errorLogger_1.logError)("Dashboard top products error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.DashboardController = DashboardController;
