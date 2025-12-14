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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = require("../models/Booking");
const Product_1 = require("../models/Product");
const order_service_1 = require("./order.service");
const orderService = new order_service_1.OrderService();
class BookingService {
    async hasOverlap(orgId, productId, fromDateTime, toDateTime, excludeId) {
        const query = {
            orgId,
            productId,
            status: { $ne: "CANCELLED" },
            $or: [
                {
                    fromDateTime: { $lt: toDateTime },
                    toDateTime: { $gt: fromDateTime },
                },
            ],
        };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const bookings = await Booking_1.Booking.find(query);
        return bookings;
    }
    async checkConflicts(data) {
        const { orgId, productId, fromDateTime, toDateTime, excludeBookingId } = data;
        const conflicts = await this.hasOverlap(orgId, productId, fromDateTime, toDateTime, excludeBookingId);
        // Populate order to get customerName
        const conflictsWithOrder = await Booking_1.Booking.populate(conflicts, {
            path: "orderId",
            select: "customerName",
        });
        return conflictsWithOrder.map((c) => ({
            bookingId: c._id.toString(),
            customerName: c.orderId?.customerName || "Unknown",
            fromDateTime: c.fromDateTime.toISOString(),
            toDateTime: c.toDateTime.toISOString(),
            status: c.status,
        }));
    }
    async listBookings(filters) {
        const { orgId, status, startDate, endDate, productId, search } = filters;
        // Build base query
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
        // If search is provided, use aggregation pipeline to search across related collections
        if (search && search.trim()) {
            const searchTerm = search.trim();
            // First, get all bookings matching the base query
            const baseBookings = await Booking_1.Booking.find(query)
                .select("_id orderId productId fromDateTime")
                .lean();
            if (baseBookings.length === 0) {
                return [];
            }
            // Get unique order and product IDs (convert to ObjectId instances)
            const orderIds = [
                ...new Set(baseBookings
                    .map((b) => {
                    if (!b.orderId)
                        return null;
                    return typeof b.orderId === "string"
                        ? new mongoose_1.default.Types.ObjectId(b.orderId)
                        : b.orderId;
                })
                    .filter(Boolean)),
            ];
            const productIds = [
                ...new Set(baseBookings
                    .map((b) => {
                    if (!b.productId)
                        return null;
                    return typeof b.productId === "string"
                        ? new mongoose_1.default.Types.ObjectId(b.productId)
                        : b.productId;
                })
                    .filter(Boolean)),
            ];
            // Search in orders and products
            const { Order } = await Promise.resolve().then(() => __importStar(require("../models/Order")));
            const { Product } = await Promise.resolve().then(() => __importStar(require("../models/Product")));
            const matchingOrders = await Order.find({
                _id: { $in: orderIds },
                $or: [
                    { customerName: { $regex: searchTerm, $options: "i" } },
                    { customerPhone: { $regex: searchTerm, $options: "i" } },
                ],
            })
                .select("_id")
                .lean();
            const matchingProducts = await Product.find({
                _id: { $in: productIds },
                title: { $regex: searchTerm, $options: "i" },
            })
                .select("_id")
                .lean();
            const matchingOrderIds = new Set(matchingOrders.map((o) => o._id.toString()));
            const matchingProductIds = new Set(matchingProducts.map((p) => p._id.toString()));
            // Filter bookings that match either order or product
            const matchingBookingIds = baseBookings
                .filter((b) => {
                const orderId = b.orderId?.toString();
                const productId = b.productId?.toString();
                return ((orderId && matchingOrderIds.has(orderId)) ||
                    (productId && matchingProductIds.has(productId)));
            })
                .map((b) => b._id);
            if (matchingBookingIds.length === 0) {
                return [];
            }
            // Return full booking documents with population
            return await Booking_1.Booking.find({ _id: { $in: matchingBookingIds } })
                .populate("productId")
                .populate("categoryId")
                .populate("orderId", "customerName customerPhone")
                .sort({ fromDateTime: 1 });
        }
        // No search - use regular query
        return await Booking_1.Booking.find(query)
            .populate("productId")
            .populate("categoryId")
            .populate("orderId", "customerName customerPhone")
            .sort({ fromDateTime: 1 });
    }
    async getBookingById(id, orgId) {
        const booking = await Booking_1.Booking.findOne({ _id: id, orgId })
            .populate("productId")
            .populate("categoryId")
            .populate("orderId", "customerName customerPhone");
        if (!booking) {
            throw new Error("Booking not found");
        }
        // Sort payments by date (newest first) for consistent display
        if (booking.payments && booking.payments.length > 0) {
            booking.payments.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        }
        return booking;
    }
    async updateBooking(id, orgId, data) {
        const existing = await Booking_1.Booking.findOne({ _id: id, orgId });
        if (!existing) {
            throw new Error("Booking not found");
        }
        // Prevent editing bookings that are already issued, returned, or cancelled
        if (existing.status === "ISSUED" ||
            existing.status === "RETURNED" ||
            existing.status === "CANCELLED") {
            throw new Error(`Cannot edit booking. Booking with status "${existing.status}" cannot be edited.`);
        }
        // Handle productId update
        const productIdToUse = data.productId || existing.productId.toString();
        // Handle date/time updates and conflict checking
        // Use new productId if it's being updated, otherwise use existing
        if (data.fromDateTime || data.toDateTime || data.productId) {
            const from = new Date(data.fromDateTime || existing.fromDateTime);
            const to = new Date(data.toDateTime || existing.toDateTime);
            const conflicts = await this.hasOverlap(orgId, productIdToUse, from, to, id);
            if (conflicts.length > 0 && !data.overrideConflicts) {
                // Populate order to get customer name for conflicts
                const conflictsWithOrder = await Booking_1.Booking.populate(conflicts, {
                    path: "orderId",
                    select: "customerName",
                });
                const conflictDetails = conflictsWithOrder.map((c) => ({
                    bookingId: c._id.toString(),
                    customerName: c.orderId?.customerName || "Unknown",
                    fromDateTime: c.fromDateTime.toISOString(),
                    toDateTime: c.toDateTime.toISOString(),
                    status: c.status,
                }));
                throw new Error("CONFLICT");
            }
            if (data.fromDateTime || data.toDateTime) {
                existing.fromDateTime = from;
                existing.toDateTime = to;
            }
            // Set conflict override flag if conflicts were found and overridden
            if (conflicts.length > 0) {
                existing.isConflictOverridden = true;
            }
        }
        // Update productId if provided
        if (data.productId !== undefined) {
            // Validate that the product exists
            const product = await Product_1.Product.findOne({
                _id: data.productId,
                orgId,
            });
            if (!product) {
                throw new Error("Product not found");
            }
            existing.productId = new mongoose_1.default.Types.ObjectId(data.productId);
        }
        // Update other fields (customer info is in order, not booking)
        if (data.categoryId !== undefined) {
            if (data.categoryId) {
                existing.categoryId = new mongoose_1.default.Types.ObjectId(data.categoryId);
            }
            else {
                existing.categoryId = undefined;
            }
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
            .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
            .reduce((sum, p) => sum + p.amount, 0) -
            existing.payments
                .filter((p) => p.type === "REFUND")
                .reduce((sum, p) => sum + p.amount, 0);
        existing.remainingAmount = existing.decidedRent - totalPaid;
        const updated = await existing.save();
        await updated.populate("categoryId");
        await updated.populate("orderId", "customerName customerPhone");
        // Update order status after booking update
        if (updated.orderId) {
            const { OrderService } = await Promise.resolve().then(() => __importStar(require("./order.service")));
            const orderService = new OrderService();
            const orderIdStr = typeof updated.orderId === "string"
                ? updated.orderId
                : updated.orderId._id.toString();
            await orderService.updateOrderStatus(orderIdStr);
        }
        return updated;
    }
    /**
     * Cancel a booking - only status change allowed via this method
     */
    async cancelBooking(id, orgId, refundAmount) {
        const booking = await Booking_1.Booking.findOne({ _id: id, orgId });
        if (!booking) {
            throw new Error("Booking not found");
        }
        const previousStatus = booking.status;
        // Only allow cancellation if booking is in BOOKED status
        if (previousStatus !== "BOOKED") {
            throw new Error(`Cannot cancel booking. Booking must be in "BOOKED" status to cancel. Current status: ${previousStatus}`);
        }
        // For cancellation, use refundAmount parameter if provided
        // If not provided, it will be calculated automatically
        const cancellationRefundAmount = refundAmount !== undefined && refundAmount >= 0
            ? refundAmount
            : undefined;
        const refundInfo = await orderService.handleBookingCancellation(id, orgId, cancellationRefundAmount);
        // The booking status is already set to CANCELLED by handleBookingCancellation
        const cancelledBooking = await Booking_1.Booking.findById(id)
            .populate("productId")
            .populate("categoryId")
            .populate("orderId");
        // Attach refund info to booking object for frontend
        cancelledBooking.cancellationInfo = refundInfo;
        return cancelledBooking;
    }
    /**
     * Issue a product - change status to ISSUED and optionally collect payment
     */
    async issueProduct(id, orgId, paymentAmount, paymentNote) {
        const booking = await Booking_1.Booking.findOne({ _id: id, orgId });
        if (!booking) {
            throw new Error("Booking not found");
        }
        // Only allow issuing if booking is in BOOKED status
        if (booking.status !== "BOOKED") {
            throw new Error(`Cannot issue booking. Booking must be in "BOOKED" status. Current status: ${booking.status}`);
        }
        // If payment amount is provided, add it as a payment
        if (paymentAmount !== undefined && paymentAmount > 0) {
            // Calculate current remaining amount before adding payment
            const currentTotalPaid = booking.payments
                .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
                .reduce((sum, p) => sum + p.amount, 0) -
                booking.payments
                    .filter((p) => p.type === "REFUND")
                    .reduce((sum, p) => sum + p.amount, 0);
            const currentRemaining = booking.decidedRent - currentTotalPaid;
            // Prevent overpayment - only allow payment up to remaining amount
            if (currentRemaining <= 0) {
                throw new Error("Booking is already fully paid. No additional payment needed.");
            }
            // Don't allow payment more than remaining amount
            const allowedPaymentAmount = Math.min(paymentAmount, currentRemaining);
            if (allowedPaymentAmount < paymentAmount) {
                throw new Error(`Payment amount (Rs.${paymentAmount.toFixed(2)}) exceeds remaining amount (Rs.${currentRemaining.toFixed(2)}). Maximum allowed: Rs.${currentRemaining.toFixed(2)}.`);
            }
            // Add payment entry as PAYMENT_RECEIVED (normal payment on issue)
            const defaultNote = `Payment received Rs.${allowedPaymentAmount.toFixed(2)}`;
            booking.payments.push({
                type: "PAYMENT_RECEIVED",
                amount: allowedPaymentAmount,
                at: new Date(),
                note: paymentNote || defaultNote,
            });
            // Recalculate amounts
            const totalPaid = booking.payments
                .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
                .reduce((sum, p) => sum + p.amount, 0) -
                booking.payments
                    .filter((p) => p.type === "REFUND")
                    .reduce((sum, p) => sum + p.amount, 0);
            booking.remainingAmount = booking.decidedRent - totalPaid;
        }
        // Change status to ISSUED
        booking.status = "ISSUED";
        const savedBooking = await booking.save();
        // Populate order info before returning
        await savedBooking.populate("orderId", "customerName customerPhone");
        // Update order status after booking status change
        if (savedBooking.orderId) {
            const orderIdStr = typeof savedBooking.orderId === "string"
                ? savedBooking.orderId
                : savedBooking.orderId._id.toString();
            await orderService.updateOrderStatus(orderIdStr);
        }
        return savedBooking;
    }
    /**
     * Return a product - change status to RETURNED and optionally collect payment
     */
    async returnProduct(id, orgId, paymentAmount, paymentNote) {
        const booking = await Booking_1.Booking.findOne({ _id: id, orgId });
        if (!booking) {
            throw new Error("Booking not found");
        }
        // Only allow returning if booking is in ISSUED status
        if (booking.status !== "ISSUED") {
            throw new Error(`Cannot return booking. Booking must be in "ISSUED" status. Current status: ${booking.status}`);
        }
        // If payment amount is provided, add it as a payment
        if (paymentAmount !== undefined && paymentAmount > 0) {
            // Calculate current remaining amount before adding payment
            const currentTotalPaid = booking.payments
                .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
                .reduce((sum, p) => sum + p.amount, 0) -
                booking.payments
                    .filter((p) => p.type === "REFUND")
                    .reduce((sum, p) => sum + p.amount, 0);
            const currentRemaining = booking.decidedRent - currentTotalPaid;
            // Prevent overpayment - only allow payment up to remaining amount
            if (currentRemaining <= 0) {
                throw new Error("Booking is already fully paid. No additional payment needed.");
            }
            // Don't allow payment more than remaining amount
            const allowedPaymentAmount = Math.min(paymentAmount, currentRemaining);
            if (allowedPaymentAmount < paymentAmount) {
                throw new Error(`Payment amount (Rs.${paymentAmount.toFixed(2)}) exceeds remaining amount (Rs.${currentRemaining.toFixed(2)}). Maximum allowed: Rs.${currentRemaining.toFixed(2)}.`);
            }
            // Add payment entry as PAYMENT_RECEIVED (normal payment on return)
            const defaultNote = `Payment received Rs.${allowedPaymentAmount.toFixed(2)}`;
            booking.payments.push({
                type: "PAYMENT_RECEIVED",
                amount: allowedPaymentAmount,
                at: new Date(),
                note: paymentNote || defaultNote,
            });
            // Recalculate amounts
            const totalPaid = booking.payments
                .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
                .reduce((sum, p) => sum + p.amount, 0) -
                booking.payments
                    .filter((p) => p.type === "REFUND")
                    .reduce((sum, p) => sum + p.amount, 0);
            booking.remainingAmount = booking.decidedRent - totalPaid;
        }
        // Change status to RETURNED
        booking.status = "RETURNED";
        const savedBooking = await booking.save();
        // Populate order info before returning
        await savedBooking.populate("orderId", "customerName customerPhone");
        // Update order status after booking status change
        if (savedBooking.orderId) {
            const orderIdStr = typeof savedBooking.orderId === "string"
                ? savedBooking.orderId
                : savedBooking.orderId._id.toString();
            await orderService.updateOrderStatus(orderIdStr);
        }
        return savedBooking;
    }
    /**
     * Calculate total paid amount (payments minus refunds)
     */
    calculateTotalPaid(payments) {
        const paymentsTotal = payments
            .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
            .reduce((sum, p) => sum + p.amount, 0);
        const refundsTotal = payments
            .filter((p) => p.type === "REFUND")
            .reduce((sum, p) => sum + p.amount, 0);
        return paymentsTotal - refundsTotal;
    }
    /**
     * Calculate total advance amount (advance payments minus refunds)
     */
    calculateTotalAdvance(payments) {
        const advanceTotal = payments
            .filter((p) => p.type === "ADVANCE")
            .reduce((sum, p) => sum + p.amount, 0);
        const refundsTotal = payments
            .filter((p) => p.type === "REFUND")
            .reduce((sum, p) => sum + p.amount, 0);
        return Math.max(0, advanceTotal - refundsTotal);
    }
    /**
     * Update booking financial fields and save
     */
    async updateBookingAmounts(booking) {
        const totalPaid = this.calculateTotalPaid(booking.payments);
        const totalAdvance = this.calculateTotalAdvance(booking.payments);
        booking.advanceAmount = totalAdvance;
        booking.remainingAmount = booking.decidedRent - totalPaid;
        const savedBooking = await booking.save();
        await savedBooking.populate("orderId", "customerName customerPhone");
        // Update order status if booking belongs to an order
        if (savedBooking.orderId) {
            const { OrderService } = await Promise.resolve().then(() => __importStar(require("./order.service")));
            const orderService = new OrderService();
            const orderIdStr = typeof savedBooking.orderId === "string"
                ? savedBooking.orderId
                : savedBooking.orderId._id.toString();
            await orderService.updateOrderStatus(orderIdStr);
        }
        return savedBooking;
    }
    /**
     * Generate payment note based on type and amount
     */
    generatePaymentNote(type, amount, originalAmount, customNote) {
        if (customNote)
            return customNote;
        if (type === "REFUND") {
            return `Refund processed Rs.${amount.toFixed(2)}`;
        }
        const isAdjusted = originalAmount !== undefined && originalAmount > amount;
        const amountText = `Rs.${amount.toFixed(2)}`;
        const adjustedText = isAdjusted
            ? ` (adjusted from Rs.${originalAmount.toFixed(2)})`
            : "";
        if (type === "ADVANCE") {
            return `Advance received ${amountText}${adjustedText}`;
        }
        return `Payment received ${amountText}${adjustedText}`;
    }
    async addPayment(id, orgId, paymentData) {
        const booking = await Booking_1.Booking.findOne({ _id: id, orgId });
        if (!booking) {
            throw new Error("Booking not found");
        }
        const currentTotalPaid = this.calculateTotalPaid(booking.payments);
        const currentRemaining = booking.decidedRent - currentTotalPaid;
        // Handle REFUND type separately
        if (paymentData.type === "REFUND") {
            // Validate that there's money to refund
            if (currentTotalPaid <= 0) {
                throw new Error("Cannot process refund. No payment has been made for this booking.");
            }
            // Validate that refund amount doesn't exceed total paid
            if (paymentData.amount > currentTotalPaid) {
                throw new Error(`Refund amount (Rs.${paymentData.amount.toFixed(2)}) cannot exceed total paid amount (Rs.${currentTotalPaid.toFixed(2)}). Maximum refund allowed: Rs.${currentTotalPaid.toFixed(2)}.`);
            }
            // Add refund payment (amount already validated above)
            booking.payments.push({
                type: "REFUND",
                amount: paymentData.amount,
                at: new Date(),
                note: this.generatePaymentNote("REFUND", paymentData.amount, undefined, paymentData.note),
            });
            return this.updateBookingAmounts(booking);
        }
        // Handle regular payments (ADVANCE or PAYMENT_RECEIVED)
        // Prevent overpayment - only allow payment if there's remaining amount
        if (currentRemaining <= 0) {
            throw new Error("Booking is already fully paid. No additional payment needed.");
        }
        // Auto-determine payment type: if booking is still BOOKED, it's ADVANCE
        const paymentType = booking.status === "BOOKED" ? "ADVANCE" : "PAYMENT_RECEIVED";
        // Adjust payment amount if it exceeds remaining amount
        const allowedPaymentAmount = Math.min(paymentData.amount, currentRemaining);
        // Add payment
        booking.payments.push({
            type: paymentType,
            amount: allowedPaymentAmount,
            at: new Date(),
            note: this.generatePaymentNote(paymentType, allowedPaymentAmount, paymentData.amount, paymentData.note),
        });
        return this.updateBookingAmounts(booking);
    }
}
exports.BookingService = BookingService;
