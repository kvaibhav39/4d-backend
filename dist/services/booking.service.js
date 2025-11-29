"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const Booking_1 = require("../models/Booking");
const Product_1 = require("../models/Product");
class BookingService {
    async hasOverlap(orgId, productId, fromDateTime, toDateTime, excludeId) {
        const query = {
            orgId,
            productId,
            status: { $ne: "CANCELLED" },
            $or: [
                { fromDateTime: { $lt: toDateTime }, toDateTime: { $gt: fromDateTime } },
            ],
        };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        return await Booking_1.Booking.find(query);
    }
    async checkConflicts(data) {
        const { orgId, productId, fromDateTime, toDateTime, excludeBookingId } = data;
        const conflicts = await this.hasOverlap(orgId, productId, fromDateTime, toDateTime, excludeBookingId);
        return conflicts.map((c) => ({
            bookingId: c._id.toString(),
            customerName: c.customerName,
            fromDateTime: c.fromDateTime.toISOString(),
            toDateTime: c.toDateTime.toISOString(),
            status: c.status,
        }));
    }
    async listBookings(filters) {
        const { orgId, status, startDate, endDate, productId } = filters;
        const query = { orgId };
        if (status) {
            query.status = status;
        }
        if (productId) {
            query.productId = productId;
        }
        if (startDate || endDate) {
            query.$or = [];
            if (startDate) {
                const start = new Date(startDate);
                const startEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000);
                query.$or.push({
                    fromDateTime: { $gte: start, $lt: startEnd },
                });
                query.$or.push({
                    toDateTime: { $gte: start, $lt: startEnd },
                });
            }
            if (endDate) {
                const end = new Date(endDate);
                const endEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);
                if (!query.$or.length) {
                    query.$or.push({});
                }
                query.$or.push({
                    fromDateTime: { $gte: end, $lt: endEnd },
                });
                query.$or.push({
                    toDateTime: { $gte: end, $lt: endEnd },
                });
            }
            if (query.$or.length === 0)
                delete query.$or;
        }
        return await Booking_1.Booking.find(query)
            .populate("productId")
            .populate("categoryId")
            .sort({ fromDateTime: 1 });
    }
    async getBookingById(id, orgId) {
        const booking = await Booking_1.Booking.findOne({ _id: id, orgId })
            .populate("productId")
            .populate("categoryId");
        if (!booking) {
            throw new Error("Booking not found");
        }
        return booking;
    }
    async createBooking(data) {
        const { orgId, productId, categoryId, customerName, customerPhone, fromDateTime, toDateTime, decidedRent, advanceAmount, additionalItemsDescription, overrideConflicts, } = data;
        // Verify product exists
        const product = await Product_1.Product.findOne({ _id: productId, orgId });
        if (!product) {
            throw new Error("Product not found for this org");
        }
        const from = new Date(fromDateTime);
        const to = new Date(toDateTime);
        // Check for conflicts
        const conflicts = await this.hasOverlap(orgId, productId, from, to);
        if (conflicts.length > 0 && !overrideConflicts) {
            const conflictDetails = conflicts.map((c) => ({
                bookingId: c._id.toString(),
                customerName: c.customerName,
                fromDateTime: c.fromDateTime.toISOString(),
                toDateTime: c.toDateTime.toISOString(),
                status: c.status,
            }));
            throw new Error("CONFLICT");
        }
        const remainingAmount = decidedRent - advanceAmount;
        const booking = await Booking_1.Booking.create({
            orgId,
            productId,
            categoryId: categoryId || product.categoryId || undefined,
            customerName,
            customerPhone,
            fromDateTime: from,
            toDateTime: to,
            productDefaultRent: product.defaultRent,
            decidedRent,
            advanceAmount,
            remainingAmount,
            status: "BOOKED",
            isConflictOverridden: conflicts.length > 0,
            additionalItemsDescription,
            payments: [
                {
                    type: "ADVANCE",
                    amount: advanceAmount,
                    at: new Date(),
                    note: "Advance on booking",
                },
            ],
        });
        return booking;
    }
    async updateBooking(id, orgId, data) {
        const existing = await Booking_1.Booking.findOne({ _id: id, orgId });
        if (!existing) {
            throw new Error("Booking not found");
        }
        // Handle date/time updates and conflict checking
        if (data.fromDateTime || data.toDateTime) {
            const from = new Date(data.fromDateTime || existing.fromDateTime);
            const to = new Date(data.toDateTime || existing.toDateTime);
            const conflicts = await this.hasOverlap(orgId, existing.productId.toString(), from, to, id);
            if (conflicts.length > 0 && !data.overrideConflicts) {
                const conflictDetails = conflicts.map((c) => ({
                    bookingId: c._id.toString(),
                    customerName: c.customerName,
                    fromDateTime: c.fromDateTime.toISOString(),
                    toDateTime: c.toDateTime.toISOString(),
                    status: c.status,
                }));
                throw new Error("CONFLICT");
            }
            existing.fromDateTime = from;
            existing.toDateTime = to;
            existing.isConflictOverridden = conflicts.length > 0;
        }
        // Update other fields
        if (data.categoryId !== undefined) {
            existing.categoryId = data.categoryId || null;
        }
        if (data.customerName) {
            existing.customerName = data.customerName;
        }
        if (data.customerPhone !== undefined) {
            existing.customerPhone = data.customerPhone;
        }
        if (typeof data.decidedRent === "number") {
            existing.decidedRent = data.decidedRent;
        }
        if (typeof data.advanceAmount === "number") {
            existing.advanceAmount = data.advanceAmount;
            // Update advance payment if it exists
            const advancePayment = existing.payments.find((p) => p.type === "ADVANCE");
            if (advancePayment) {
                advancePayment.amount = data.advanceAmount;
            }
            else {
                existing.payments.push({
                    type: "ADVANCE",
                    amount: data.advanceAmount,
                    at: new Date(),
                    note: "Advance on booking",
                });
            }
        }
        if (data.additionalItemsDescription !== undefined) {
            existing.additionalItemsDescription = data.additionalItemsDescription;
        }
        // Recalculate remaining based on all payments
        const totalPaid = existing.payments
            .filter((p) => p.type === "ADVANCE" || p.type === "RENT_REMAINING")
            .reduce((sum, p) => sum + p.amount, 0) -
            existing.payments
                .filter((p) => p.type === "REFUND")
                .reduce((sum, p) => sum + p.amount, 0);
        existing.remainingAmount = existing.decidedRent - totalPaid;
        const updated = await existing.save();
        await updated.populate("categoryId");
        return updated;
    }
    async updateBookingStatus(id, orgId, status) {
        const booking = await Booking_1.Booking.findOne({ _id: id, orgId });
        if (!booking) {
            throw new Error("Booking not found");
        }
        booking.status = status;
        return await booking.save();
    }
    async addPayment(id, orgId, paymentData) {
        const booking = await Booking_1.Booking.findOne({ _id: id, orgId });
        if (!booking) {
            throw new Error("Booking not found");
        }
        booking.payments.push({
            type: paymentData.type,
            amount: paymentData.amount,
            at: new Date(),
            note: paymentData.note,
        });
        // Recalculate remaining amount
        const totalPaid = booking.payments
            .filter((p) => p.type === "ADVANCE" || p.type === "RENT_REMAINING")
            .reduce((sum, p) => sum + p.amount, 0) -
            booking.payments
                .filter((p) => p.type === "REFUND")
                .reduce((sum, p) => sum + p.amount, 0);
        booking.remainingAmount = booking.decidedRent - totalPaid;
        return await booking.save();
    }
}
exports.BookingService = BookingService;
