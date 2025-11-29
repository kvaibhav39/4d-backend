"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const Booking_1 = require("../models/Booking");
class DashboardService {
    async getStats(params) {
        const { orgId, date } = params;
        const startDate = date
            ? new Date(date)
            : new Date(new Date().setHours(0, 0, 0, 0));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        const bookings = await Booking_1.Booking.find({
            orgId,
            $or: [
                { fromDateTime: { $gte: startDate, $lt: endDate } },
                { toDateTime: { $gte: startDate, $lt: endDate } },
            ],
        });
        const stats = {
            totalBookings: bookings.length,
            bookedCount: bookings.filter((b) => b.status === "BOOKED").length,
            issuedCount: bookings.filter((b) => b.status === "ISSUED").length,
            returnedCount: bookings.filter((b) => b.status === "RETURNED").length,
            cancelledCount: bookings.filter((b) => b.status === "CANCELLED").length,
            totalRent: bookings.reduce((sum, b) => sum + b.decidedRent, 0),
            totalReceived: bookings.reduce((sum, booking) => {
                const paid = booking.payments
                    .filter((p) => p.type === "ADVANCE" || p.type === "RENT_REMAINING")
                    .reduce((s, p) => s + p.amount, 0) -
                    booking.payments
                        .filter((p) => p.type === "REFUND")
                        .reduce((s, p) => s + p.amount, 0);
                return sum + paid;
            }, 0),
        };
        return stats;
    }
    async getBookingsForDate(orgId, date) {
        const startDate = date
            ? new Date(date)
            : new Date(new Date().setHours(0, 0, 0, 0));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        return await Booking_1.Booking.find({
            orgId,
            $or: [
                { fromDateTime: { $gte: startDate, $lt: endDate } },
                { toDateTime: { $gte: startDate, $lt: endDate } },
            ],
        })
            .populate("productId")
            .populate("categoryId")
            .sort({ fromDateTime: 1 });
    }
}
exports.DashboardService = DashboardService;
