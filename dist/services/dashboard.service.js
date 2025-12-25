"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = require("../models/Booking");
class DashboardService {
    async getStats(params) {
        const { orgId } = params;
        // Use aggregation for efficient stats calculation instead of loading all bookings
        const statsAgg = await Booking_1.Booking.aggregate([
            {
                $match: {
                    orgId: new mongoose_1.default.Types.ObjectId(orgId),
                },
            },
            {
                $facet: {
                    // Count by status
                    statusCounts: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    // Total bookings count
                    totalCount: [
                        {
                            $count: "total",
                        },
                    ],
                    // Calculate total rent (excluding cancelled)
                    totalRent: [
                        {
                            $match: {
                                status: { $ne: "CANCELLED" },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$decidedRent" },
                            },
                        },
                    ],
                    // Calculate total received (excluding cancelled)
                    totalReceived: [
                        {
                            $match: {
                                status: { $ne: "CANCELLED" },
                            },
                        },
                        {
                            $unwind: "$payments",
                        },
                        {
                            $group: {
                                _id: "$payments.type",
                                total: { $sum: "$payments.amount" },
                            },
                        },
                    ],
                },
            },
        ]);
        const result = statsAgg[0];
        // Process status counts
        const statusMap = new Map();
        result.statusCounts.forEach((s) => {
            statusMap.set(s._id, s.count);
        });
        // Calculate total received (payments - refunds)
        let totalReceived = 0;
        result.totalReceived.forEach((r) => {
            if (r._id === "ADVANCE" || r._id === "PAYMENT_RECEIVED") {
                totalReceived += r.total;
            }
            else if (r._id === "REFUND") {
                totalReceived -= r.total;
            }
        });
        const stats = {
            totalBookings: result.totalCount.length > 0 ? result.totalCount[0].total : 0,
            bookedCount: statusMap.get("BOOKED") || 0,
            issuedCount: statusMap.get("ISSUED") || 0,
            returnedCount: statusMap.get("RETURNED") || 0,
            cancelledCount: statusMap.get("CANCELLED") || 0,
            totalRent: result.totalRent.length > 0 ? result.totalRent[0].total : 0,
            totalReceived,
        };
        return stats;
    }
    async getBookingsForDate(orgId, date) {
        const startDate = date
            ? new Date(date)
            : new Date(new Date().setHours(0, 0, 0, 0));
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setHours(0, 0, 0, 0);
        // Filter by createdAt (booking creation date) to show bookings created on the selected date
        return await Booking_1.Booking.find({
            orgId,
            createdAt: { $gte: startDate, $lt: endDate },
        })
            .populate("productId")
            .populate("categoryId")
            .populate("orderId", "customerName customerPhone")
            .sort({ createdAt: -1 }); // Sort by creation date, newest first
    }
    async getRecentBookings(orgId, days = 5) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        // Filter by createdAt (booking creation date)
        return await Booking_1.Booking.find({
            orgId,
            createdAt: { $gte: startDate },
        })
            .populate("productId")
            .populate("categoryId")
            .populate("orderId", "customerName customerPhone")
            .sort({ createdAt: -1 });
    }
    async getCustomerPickups(orgId, days = 7) {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        endDate.setHours(23, 59, 59, 999);
        // Filter by fromDateTime (pickup date) to show products ready for customer pickup
        // Show all past BOOKED bookings (overdue pickups) plus next 7 days
        // Only show bookings with BOOKED status (items not yet issued to customers)
        return await Booking_1.Booking.find({
            orgId,
            fromDateTime: { $lte: endDate }, // Include all past dates and next 7 days
            status: "BOOKED", // Only show BOOKED status (not yet issued)
        })
            .populate("productId")
            .populate("categoryId")
            .populate("orderId", "customerName customerPhone")
            .sort({ fromDateTime: 1 }); // Sort by fromDateTime ascending (earliest first)
    }
    async getCustomerReturns(orgId, days = 7) {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        endDate.setHours(23, 59, 59, 999);
        // Filter by toDateTime (return date) to show products ready to return
        // Show all past ISSUED bookings (overdue returns) plus next 7 days
        // Only show bookings with ISSUED status (items already issued to customers, now due to be returned)
        return await Booking_1.Booking.find({
            orgId,
            toDateTime: { $lte: endDate }, // Include all past dates and next 7 days
            status: "ISSUED", // Only show ISSUED status (items already with customers)
        })
            .populate("productId")
            .populate("categoryId")
            .populate("orderId", "customerName customerPhone")
            .sort({ toDateTime: 1 }); // Sort by return date ascending (earliest first)
    }
    async getTopProducts(orgId, limit = 5) {
        // Aggregate bookings by productId, excluding CANCELLED bookings
        const topProducts = await Booking_1.Booking.aggregate([
            {
                $match: {
                    orgId: new mongoose_1.default.Types.ObjectId(orgId),
                    status: { $ne: "CANCELLED" },
                },
            },
            {
                $group: {
                    _id: "$productId",
                    bookingCount: { $sum: 1 },
                },
            },
            {
                $sort: { bookingCount: -1 },
            },
            {
                $limit: limit,
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            {
                $unwind: {
                    path: "$product",
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "product.categoryId",
                    foreignField: "_id",
                    as: "category",
                },
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    product: {
                        _id: { $toString: "$product._id" },
                        title: "$product.title",
                        code: "$product.code",
                        imageUrl: "$product.imageUrl",
                        defaultRent: "$product.defaultRent",
                        category: {
                            $cond: {
                                if: { $ifNull: ["$category", false] },
                                then: {
                                    _id: { $toString: "$category._id" },
                                    name: "$category.name",
                                },
                                else: null,
                            },
                        },
                    },
                    bookingCount: 1,
                },
            },
        ]);
        return topProducts;
    }
}
exports.DashboardService = DashboardService;
