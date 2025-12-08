"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const booking_service_1 = require("../services/booking.service");
const bookingService = new booking_service_1.BookingService();
class BookingController {
    async checkConflicts(req, res) {
        try {
            const orgId = req.user.orgId;
            const { productId, fromDateTime, toDateTime, excludeBookingId } = req.body;
            const conflicts = await bookingService.checkConflicts({
                orgId,
                productId,
                fromDateTime: new Date(fromDateTime),
                toDateTime: new Date(toDateTime),
                excludeBookingId,
            });
            res.json({ conflicts });
        }
        catch (error) {
            console.error("Check conflicts error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async listBookings(req, res) {
        try {
            const orgId = req.user.orgId;
            const { status, startDate, endDate, productId, search } = req.query;
            const bookings = await bookingService.listBookings({
                orgId,
                status: status,
                startDate: startDate,
                endDate: endDate,
                productId: productId,
                search: search,
            });
            res.json(bookings);
        }
        catch (error) {
            console.error("List bookings error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getBooking(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const booking = await bookingService.getBookingById(id, orgId);
            res.json(booking);
        }
        catch (error) {
            if (error.message === "Booking not found") {
                return res.status(404).json({ message: error.message });
            }
            console.error("Get booking error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async createBooking(req, res) {
        try {
            // Note: Direct booking creation is deprecated. Bookings should be created through orders.
            // This endpoint is kept for backwards compatibility but requires orderId.
            return res.status(400).json({
                message: "Bookings must be created through orders. Please use POST /orders/:id/bookings",
            });
        }
        catch (error) {
            console.error("Create booking error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async updateBooking(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const { productId, categoryId, fromDateTime, toDateTime, decidedRent, advanceAmount, additionalItemsDescription, overrideConflicts, } = req.body;
            const updateData = {};
            if (productId !== undefined)
                updateData.productId = productId;
            if (categoryId !== undefined)
                updateData.categoryId = categoryId || null;
            // Customer info is in order, not booking - removed customerName and customerPhone
            if (fromDateTime)
                updateData.fromDateTime = new Date(fromDateTime);
            if (toDateTime)
                updateData.toDateTime = new Date(toDateTime);
            if (typeof decidedRent === "number")
                updateData.decidedRent = decidedRent;
            if (typeof advanceAmount === "number")
                updateData.advanceAmount = advanceAmount;
            if (additionalItemsDescription !== undefined)
                updateData.additionalItemsDescription = additionalItemsDescription;
            if (overrideConflicts !== undefined)
                updateData.overrideConflicts = overrideConflicts;
            const booking = await bookingService.updateBooking(id, orgId, updateData);
            res.json(booking);
        }
        catch (error) {
            if (error.message === "Booking not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes("Cannot edit booking") &&
                error.message.includes("status")) {
                return res.status(400).json({ message: error.message });
            }
            if (error.message === "CONFLICT") {
                // Get conflicts for response
                try {
                    const orgId = req.user.orgId;
                    const { id } = req.params;
                    const existing = await bookingService.getBookingById(id, orgId);
                    const { productId, fromDateTime, toDateTime } = req.body;
                    // Use new productId if provided, otherwise use existing
                    const productIdToUse = productId || existing.productId.toString();
                    const conflicts = await bookingService.checkConflicts({
                        orgId,
                        productId: productIdToUse,
                        fromDateTime: new Date(fromDateTime || existing.fromDateTime),
                        toDateTime: new Date(toDateTime || existing.toDateTime),
                        excludeBookingId: id,
                    });
                    return res.status(409).json({
                        message: "Conflicting bookings found",
                        conflicts,
                    });
                }
                catch (conflictError) {
                    return res.status(409).json({
                        message: "Conflicting bookings found",
                        conflicts: [],
                    });
                }
            }
            console.error("Update booking error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async issueProduct(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const { paymentAmount, paymentNote } = req.body;
            const booking = await bookingService.issueProduct(id, orgId, paymentAmount, paymentNote);
            res.json(booking);
        }
        catch (error) {
            if (error.message === "Booking not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message ===
                "Booking is already fully paid. No additional payment needed.") {
                return res.status(400).json({ message: error.message });
            }
            if (error.message.includes("exceeds remaining amount")) {
                return res.status(400).json({ message: error.message });
            }
            if (error.message.includes("Cannot issue booking") ||
                error.message.includes('must be in "BOOKED" status')) {
                return res.status(400).json({ message: error.message });
            }
            console.error("Issue product error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async returnProduct(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const { paymentAmount, paymentNote } = req.body;
            const booking = await bookingService.returnProduct(id, orgId, paymentAmount, paymentNote);
            res.json(booking);
        }
        catch (error) {
            if (error.message === "Booking not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message ===
                "Booking is already fully paid. No additional payment needed.") {
                return res.status(400).json({ message: error.message });
            }
            if (error.message.includes("exceeds remaining amount")) {
                return res.status(400).json({ message: error.message });
            }
            if (error.message.includes("Cannot return booking") ||
                error.message.includes('must be in "ISSUED" status')) {
                return res.status(400).json({ message: error.message });
            }
            console.error("Return product error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async cancelBooking(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const { refundAmount } = req.body;
            const booking = await bookingService.cancelBooking(id, orgId, refundAmount);
            res.json(booking);
        }
        catch (error) {
            if (error.message === "Booking not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes("Cannot cancel booking") ||
                error.message.includes('must be in "BOOKED" status')) {
                return res.status(400).json({ message: error.message });
            }
            if (error.message.includes("Refund amount") ||
                error.message.includes("cannot exceed maximum refund")) {
                return res.status(400).json({ message: error.message });
            }
            console.error("Cancel booking error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async previewCancellationRefund(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const { OrderService } = await Promise.resolve().then(() => __importStar(require("../services/order.service")));
            const orderService = new OrderService();
            const refundInfo = await orderService.previewBookingCancellationRefund(id, orgId);
            res.json(refundInfo);
        }
        catch (error) {
            if (error.message === "Booking not found") {
                return res.status(404).json({ message: error.message });
            }
            console.error("Preview cancellation refund error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async addPayment(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const { type, amount, note } = req.body;
            const booking = await bookingService.addPayment(id, orgId, {
                type,
                amount,
                note,
            });
            res.json(booking);
        }
        catch (error) {
            if (error.message === "Booking not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message ===
                "Booking is already fully paid. No additional payment needed.") {
                return res.status(400).json({ message: error.message });
            }
            // Handle refund validation errors
            if (error.message.includes("Cannot process refund")) {
                return res.status(400).json({ message: error.message });
            }
            if (error.message.includes("Refund amount") &&
                (error.message.includes("cannot exceed") ||
                    error.message.includes("exceed"))) {
                return res.status(400).json({ message: error.message });
            }
            console.error("Add payment error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.BookingController = BookingController;
