"use strict";
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
            const { status, startDate, endDate, productId } = req.query;
            const bookings = await bookingService.listBookings({
                orgId,
                status: status,
                startDate: startDate,
                endDate: endDate,
                productId: productId,
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
            const orgId = req.user.orgId;
            const { productId, categoryId, customerName, customerPhone, fromDateTime, toDateTime, decidedRent, advanceAmount, additionalItemsDescription, overrideConflicts, } = req.body;
            const booking = await bookingService.createBooking({
                orgId,
                productId,
                categoryId,
                customerName,
                customerPhone,
                fromDateTime: new Date(fromDateTime),
                toDateTime: new Date(toDateTime),
                decidedRent,
                advanceAmount,
                additionalItemsDescription,
                overrideConflicts,
            });
            res.status(201).json(booking);
        }
        catch (error) {
            if (error.message === "Product not found for this org") {
                return res.status(400).json({ message: error.message });
            }
            if (error.message === "CONFLICT") {
                // Get conflicts for response
                const orgId = req.user.orgId;
                const { productId, fromDateTime, toDateTime } = req.body;
                const conflicts = await bookingService.checkConflicts({
                    orgId,
                    productId,
                    fromDateTime: new Date(fromDateTime),
                    toDateTime: new Date(toDateTime),
                });
                return res.status(409).json({
                    message: "Conflicting bookings found",
                    conflicts,
                });
            }
            console.error("Create booking error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async updateBooking(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const { categoryId, customerName, customerPhone, fromDateTime, toDateTime, decidedRent, advanceAmount, additionalItemsDescription, overrideConflicts, } = req.body;
            const updateData = {};
            if (categoryId !== undefined)
                updateData.categoryId = categoryId || null;
            if (customerName)
                updateData.customerName = customerName;
            if (customerPhone !== undefined)
                updateData.customerPhone = customerPhone;
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
            if (error.message === "CONFLICT") {
                // Get conflicts for response
                try {
                    const orgId = req.user.orgId;
                    const { id } = req.params;
                    const existing = await bookingService.getBookingById(id, orgId);
                    const { fromDateTime, toDateTime } = req.body;
                    const conflicts = await bookingService.checkConflicts({
                        orgId,
                        productId: existing.productId.toString(),
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
    async updateBookingStatus(req, res) {
        try {
            const orgId = req.user.orgId;
            const { id } = req.params;
            const { status } = req.body;
            const booking = await bookingService.updateBookingStatus(id, orgId, status);
            res.json(booking);
        }
        catch (error) {
            if (error.message === "Booking not found") {
                return res.status(404).json({ message: error.message });
            }
            console.error("Update status error", error);
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
            console.error("Add payment error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.BookingController = BookingController;
