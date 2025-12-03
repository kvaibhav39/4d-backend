import mongoose from "mongoose";
import {
  Booking,
  IBooking,
  BookingStatus,
  PaymentType,
} from "../models/Booking";
import { Product } from "../models/Product";
import { OrderService } from "./order.service";

const orderService = new OrderService();

export interface BookingConflict {
  bookingId: string;
  customerName: string;
  fromDateTime: string;
  toDateTime: string;
  status: BookingStatus;
}

export interface CheckConflictsData {
  orgId: string;
  productId: string;
  fromDateTime: Date;
  toDateTime: Date;
  excludeBookingId?: string;
}

export interface CreateBookingData {
  orgId: string;
  orderId: string; // Required - all bookings must belong to an order
  productId: string;
  categoryId?: string;
  fromDateTime: Date;
  toDateTime: Date;
  decidedRent: number;
  advanceAmount: number;
  additionalItemsDescription?: string;
  overrideConflicts?: boolean;
}

export interface UpdateBookingData {
  categoryId?: string | null;
  fromDateTime?: Date;
  toDateTime?: Date;
  decidedRent?: number;
  advanceAmount?: number;
  additionalItemsDescription?: string;
  overrideConflicts?: boolean;
}

export interface ListBookingsFilters {
  orgId: string;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  productId?: string;
  search?: string;
}

export interface AddPaymentData {
  type: PaymentType;
  amount: number;
  note?: string;
}

export class BookingService {
  private async hasOverlap(
    orgId: string,
    productId: string,
    fromDateTime: Date,
    toDateTime: Date,
    excludeId?: string
  ): Promise<IBooking[]> {
    const query: any = {
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

    const bookings = await Booking.find(query);
    return bookings;
  }

  async checkConflicts(data: CheckConflictsData): Promise<BookingConflict[]> {
    const { orgId, productId, fromDateTime, toDateTime, excludeBookingId } =
      data;

    const conflicts = await this.hasOverlap(
      orgId,
      productId,
      fromDateTime,
      toDateTime,
      excludeBookingId
    );

    // Populate order to get customerName
    const conflictsWithOrder = await Booking.populate(conflicts, {
      path: "orderId",
      select: "customerName",
    });

    return conflictsWithOrder.map((c) => ({
      bookingId: c._id.toString(),
      customerName: (c.orderId as any)?.customerName || "Unknown",
      fromDateTime: c.fromDateTime.toISOString(),
      toDateTime: c.toDateTime.toISOString(),
      status: c.status,
    }));
  }

  async listBookings(filters: ListBookingsFilters) {
    const { orgId, status, startDate, endDate, productId, search } = filters;

    // Build base query
    const query: any = { orgId };
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
      if (query.$or.length === 0) delete query.$or;
    }

    // If search is provided, use aggregation pipeline to search across related collections
    if (search && search.trim()) {
      const searchTerm = search.trim();

      // First, get all bookings matching the base query
      const baseBookings = await Booking.find(query)
        .select("_id orderId productId fromDateTime")
        .lean();

      if (baseBookings.length === 0) {
        return [];
      }

      // Get unique order and product IDs (convert to ObjectId instances)
      const orderIds = [
        ...new Set(
          baseBookings
            .map((b) => {
              if (!b.orderId) return null;
              return typeof b.orderId === "string"
                ? new mongoose.Types.ObjectId(b.orderId)
                : b.orderId;
            })
            .filter(Boolean)
        ),
      ];
      const productIds = [
        ...new Set(
          baseBookings
            .map((b) => {
              if (!b.productId) return null;
              return typeof b.productId === "string"
                ? new mongoose.Types.ObjectId(b.productId)
                : b.productId;
            })
            .filter(Boolean)
        ),
      ];

      // Search in orders and products
      const { Order } = await import("../models/Order");
      const { Product } = await import("../models/Product");

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

      const matchingOrderIds = new Set(
        matchingOrders.map((o) => o._id.toString())
      );
      const matchingProductIds = new Set(
        matchingProducts.map((p) => p._id.toString())
      );

      // Filter bookings that match either order or product
      const matchingBookingIds = baseBookings
        .filter((b) => {
          const orderId = b.orderId?.toString();
          const productId = b.productId?.toString();
          return (
            (orderId && matchingOrderIds.has(orderId)) ||
            (productId && matchingProductIds.has(productId))
          );
        })
        .map((b) => b._id);

      if (matchingBookingIds.length === 0) {
        return [];
      }

      // Return full booking documents with population
      return await Booking.find({ _id: { $in: matchingBookingIds } })
        .populate("productId")
        .populate("categoryId")
        .populate("orderId", "customerName customerPhone")
        .sort({ fromDateTime: 1 });
    }

    // No search - use regular query
    return await Booking.find(query)
      .populate("productId")
      .populate("categoryId")
      .populate("orderId", "customerName customerPhone")
      .sort({ fromDateTime: 1 });
  }

  async getBookingById(id: string, orgId: string) {
    const booking = await Booking.findOne({ _id: id, orgId })
      .populate("productId")
      .populate("categoryId")
      .populate("orderId", "customerName customerPhone");

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }

  async createBooking(data: CreateBookingData) {
    // Note: This method is deprecated. Bookings should be created through OrderService.addBookingToOrder
    // This is kept for backwards compatibility but requires orderId
    const {
      orgId,
      orderId,
      productId,
      categoryId,
      fromDateTime,
      toDateTime,
      decidedRent,
      advanceAmount,
      additionalItemsDescription,
      overrideConflicts,
    } = data;

    // Verify product exists
    const product = await Product.findOne({ _id: productId, orgId });
    if (!product) {
      throw new Error("Product not found for this org");
    }

    const from = new Date(fromDateTime);
    const to = new Date(toDateTime);

    // Check for conflicts (excluding bookings in the same order)
    const existingBookings = await Booking.find({ orderId });
    const conflicts = await Booking.find({
      orgId,
      productId,
      status: { $ne: "CANCELLED" },
      _id: { $nin: existingBookings.map((b) => b._id) },
      $or: [{ fromDateTime: { $lt: to }, toDateTime: { $gt: from } }],
    });

    if (conflicts.length > 0 && !overrideConflicts) {
      // Populate order to get customer name for conflicts
      const conflictsWithOrder = await Booking.populate(conflicts, {
        path: "orderId",
        select: "customerName",
      });

      const conflictDetails = conflictsWithOrder.map((c: any) => ({
        bookingId: c._id.toString(),
        customerName: c.orderId?.customerName || "Unknown",
        fromDateTime: c.fromDateTime.toISOString(),
        toDateTime: c.toDateTime.toISOString(),
        status: c.status,
      }));
      throw new Error("CONFLICT");
    }

    const remainingAmount = decidedRent - advanceAmount;

    const booking = await Booking.create({
      orgId,
      orderId,
      productId,
      categoryId: categoryId || product.categoryId || undefined,
      fromDateTime: from,
      toDateTime: to,
      productDefaultRent: product.defaultRent,
      decidedRent,
      advanceAmount,
      remainingAmount,
      status: "BOOKED",
      isConflictOverridden: conflicts.length > 0,
      additionalItemsDescription,
      payments:
        advanceAmount > 0
          ? [
              {
                type: "ADVANCE",
                amount: advanceAmount,
                at: new Date(),
                note: `Advance received ₹${advanceAmount.toFixed(2)}`,
              },
            ]
          : [],
    });

    return booking;
  }

  async updateBooking(id: string, orgId: string, data: UpdateBookingData) {
    const existing = await Booking.findOne({ _id: id, orgId });
    if (!existing) {
      throw new Error("Booking not found");
    }

    // Handle date/time updates and conflict checking
    if (data.fromDateTime || data.toDateTime) {
      const from = new Date(data.fromDateTime || existing.fromDateTime);
      const to = new Date(data.toDateTime || existing.toDateTime);

      const conflicts = await this.hasOverlap(
        orgId,
        existing.productId.toString(),
        from,
        to,
        id
      );

      if (conflicts.length > 0 && !data.overrideConflicts) {
        // Populate order to get customer name for conflicts
        const conflictsWithOrder = await Booking.populate(conflicts, {
          path: "orderId",
          select: "customerName",
        });

        const conflictDetails = conflictsWithOrder.map((c: any) => ({
          bookingId: c._id.toString(),
          customerName: c.orderId?.customerName || "Unknown",
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

    // Update other fields (customer info is in order, not booking)
    if (data.categoryId !== undefined) {
      if (data.categoryId) {
        existing.categoryId = new mongoose.Types.ObjectId(data.categoryId);
      } else {
        existing.categoryId = undefined;
      }
    }
    if (typeof data.decidedRent === "number") {
      existing.decidedRent = data.decidedRent;
    }
    if (typeof data.advanceAmount === "number") {
      existing.advanceAmount = data.advanceAmount;
      // Update advance payment if it exists
      const advancePayment = existing.payments.find(
        (p) => p.type === "ADVANCE"
      );
      if (advancePayment) {
        advancePayment.amount = data.advanceAmount;
      } else {
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
    const totalPaid =
      existing.payments
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
      const { OrderService } = await import("./order.service");
      const orderService = new OrderService();
      const orderIdStr =
        typeof updated.orderId === "string"
          ? updated.orderId
          : (updated.orderId as any)._id.toString();
      await orderService.updateOrderStatus(orderIdStr);
    }

    return updated;
  }

  /**
   * Cancel a booking - only status change allowed via this method
   */
  async cancelBooking(id: string, orgId: string, refundAmount?: number) {
    const booking = await Booking.findOne({ _id: id, orgId });
    if (!booking) {
      throw new Error("Booking not found");
    }

    const previousStatus = booking.status;

    // Only allow cancellation if booking is in BOOKED status
    if (previousStatus !== "BOOKED") {
      throw new Error(
        `Cannot cancel booking. Booking must be in "BOOKED" status to cancel. Current status: ${previousStatus}`
      );
    }

    // For cancellation, use refundAmount parameter if provided
    // If not provided, it will be calculated automatically
    const cancellationRefundAmount =
      refundAmount !== undefined && refundAmount >= 0
        ? refundAmount
        : undefined;

    const refundInfo = await orderService.handleBookingCancellation(
      id,
      orgId,
      cancellationRefundAmount
    );
    // The booking status is already set to CANCELLED by handleBookingCancellation
    const cancelledBooking = await Booking.findById(id)
      .populate("productId")
      .populate("categoryId")
      .populate("orderId");

    // Attach refund info to booking object for frontend
    (cancelledBooking as any).cancellationInfo = refundInfo;
    return cancelledBooking;
  }

  /**
   * Issue a product - change status to ISSUED and optionally collect payment
   */
  async issueProduct(
    id: string,
    orgId: string,
    paymentAmount?: number,
    paymentNote?: string
  ) {
    const booking = await Booking.findOne({ _id: id, orgId });
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Only allow issuing if booking is in BOOKED status
    if (booking.status !== "BOOKED") {
      throw new Error(
        `Cannot issue booking. Booking must be in "BOOKED" status. Current status: ${booking.status}`
      );
    }

    // If payment amount is provided, add it as a payment
    if (paymentAmount !== undefined && paymentAmount > 0) {
      // Calculate current remaining amount before adding payment
      const currentTotalPaid =
        booking.payments
          .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
          .reduce((sum, p) => sum + p.amount, 0) -
        booking.payments
          .filter((p) => p.type === "REFUND")
          .reduce((sum, p) => sum + p.amount, 0);
      const currentRemaining = booking.decidedRent - currentTotalPaid;

      // Prevent overpayment - only allow payment up to remaining amount
      if (currentRemaining <= 0) {
        throw new Error(
          "Booking is already fully paid. No additional payment needed."
        );
      }

      // Don't allow payment more than remaining amount
      const allowedPaymentAmount = Math.min(paymentAmount, currentRemaining);

      if (allowedPaymentAmount < paymentAmount) {
        throw new Error(
          `Payment amount (₹${paymentAmount.toFixed(
            2
          )}) exceeds remaining amount (₹${currentRemaining.toFixed(
            2
          )}). Maximum allowed: ₹${currentRemaining.toFixed(2)}.`
        );
      }

      // Add payment entry as PAYMENT_RECEIVED (normal payment on issue)
      const defaultNote = `Payment received ₹${allowedPaymentAmount.toFixed(
        2
      )}`;
      booking.payments.push({
        type: "PAYMENT_RECEIVED",
        amount: allowedPaymentAmount,
        at: new Date(),
        note: paymentNote || defaultNote,
      });

      // Recalculate amounts
      const totalPaid =
        booking.payments
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
      const orderIdStr =
        typeof savedBooking.orderId === "string"
          ? savedBooking.orderId
          : (savedBooking.orderId as any)._id.toString();
      await orderService.updateOrderStatus(orderIdStr);
    }

    return savedBooking;
  }

  /**
   * Return a product - change status to RETURNED and optionally collect payment
   */
  async returnProduct(
    id: string,
    orgId: string,
    paymentAmount?: number,
    paymentNote?: string
  ) {
    const booking = await Booking.findOne({ _id: id, orgId });
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Only allow returning if booking is in ISSUED status
    if (booking.status !== "ISSUED") {
      throw new Error(
        `Cannot return booking. Booking must be in "ISSUED" status. Current status: ${booking.status}`
      );
    }

    // If payment amount is provided, add it as a payment
    if (paymentAmount !== undefined && paymentAmount > 0) {
      // Calculate current remaining amount before adding payment
      const currentTotalPaid =
        booking.payments
          .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
          .reduce((sum, p) => sum + p.amount, 0) -
        booking.payments
          .filter((p) => p.type === "REFUND")
          .reduce((sum, p) => sum + p.amount, 0);
      const currentRemaining = booking.decidedRent - currentTotalPaid;

      // Prevent overpayment - only allow payment up to remaining amount
      if (currentRemaining <= 0) {
        throw new Error(
          "Booking is already fully paid. No additional payment needed."
        );
      }

      // Don't allow payment more than remaining amount
      const allowedPaymentAmount = Math.min(paymentAmount, currentRemaining);

      if (allowedPaymentAmount < paymentAmount) {
        throw new Error(
          `Payment amount (₹${paymentAmount.toFixed(
            2
          )}) exceeds remaining amount (₹${currentRemaining.toFixed(
            2
          )}). Maximum allowed: ₹${currentRemaining.toFixed(2)}.`
        );
      }

      // Add payment entry as PAYMENT_RECEIVED (normal payment on return)
      const defaultNote = `Payment received ₹${allowedPaymentAmount.toFixed(
        2
      )}`;
      booking.payments.push({
        type: "PAYMENT_RECEIVED",
        amount: allowedPaymentAmount,
        at: new Date(),
        note: paymentNote || defaultNote,
      });

      // Recalculate amounts
      const totalPaid =
        booking.payments
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
      const orderIdStr =
        typeof savedBooking.orderId === "string"
          ? savedBooking.orderId
          : (savedBooking.orderId as any)._id.toString();
      await orderService.updateOrderStatus(orderIdStr);
    }

    return savedBooking;
  }

  async addPayment(id: string, orgId: string, paymentData: AddPaymentData) {
    const booking = await Booking.findOne({ _id: id, orgId });
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Calculate current remaining amount before adding new payment
    const currentTotalPaid =
      booking.payments
        .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
        .reduce((sum, p) => sum + p.amount, 0) -
      booking.payments
        .filter((p) => p.type === "REFUND")
        .reduce((sum, p) => sum + p.amount, 0);
    const currentRemaining = booking.decidedRent - currentTotalPaid;

    // Prevent overpayment - only allow payment if there's remaining amount
    if (currentRemaining <= 0) {
      throw new Error(
        "Booking is already fully paid. No additional payment needed."
      );
    }

    // If trying to pay more than remaining, adjust to remaining amount only
    const allowedPaymentAmount = Math.min(paymentData.amount, currentRemaining);

    // Auto-determine payment type: if booking is still BOOKED, it's ADVANCE
    let paymentType: PaymentType = paymentData.type;
    if (booking.status === "BOOKED") {
      paymentType = "ADVANCE";
    } else {
      paymentType = "PAYMENT_RECEIVED";
    }

    let paymentNote = paymentData.note;

    // If payment was adjusted, include that in the note
    if (!paymentNote && allowedPaymentAmount < paymentData.amount) {
      if (paymentType === "ADVANCE") {
        paymentNote = `Advance received ₹${allowedPaymentAmount.toFixed(
          2
        )} (adjusted from ₹${paymentData.amount.toFixed(2)})`;
      } else {
        paymentNote = `Payment received ₹${allowedPaymentAmount.toFixed(
          2
        )} (adjusted from ₹${paymentData.amount.toFixed(2)})`;
      }
    } else if (!paymentNote) {
      if (paymentType === "ADVANCE") {
        paymentNote = `Advance received ₹${allowedPaymentAmount.toFixed(2)}`;
      } else {
        paymentNote = `Payment received ₹${allowedPaymentAmount.toFixed(2)}`;
      }
    }

    booking.payments.push({
      type: paymentType,
      amount: allowedPaymentAmount,
      at: new Date(),
      note: paymentNote,
    });

    // Recalculate amounts
    const totalPaid =
      booking.payments
        .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
        .reduce((sum, p) => sum + p.amount, 0) -
      booking.payments
        .filter((p) => p.type === "REFUND")
        .reduce((sum, p) => sum + p.amount, 0);

    // Calculate total advance (only ADVANCE payments)
    const totalAdvance =
      booking.payments
        .filter((p) => p.type === "ADVANCE")
        .reduce((sum, p) => sum + p.amount, 0) -
      booking.payments
        .filter((p) => p.type === "REFUND")
        .reduce((sum, p) => sum + p.amount, 0);

    booking.advanceAmount = Math.max(0, totalAdvance);
    booking.remainingAmount = booking.decidedRent - totalPaid;

    const savedBooking = await booking.save();

    // Populate order info
    await savedBooking.populate("orderId", "customerName customerPhone");

    // Update order status after payment
    if (savedBooking.orderId) {
      const { OrderService } = await import("./order.service");
      const orderService = new OrderService();
      const orderIdStr =
        typeof savedBooking.orderId === "string"
          ? savedBooking.orderId
          : (savedBooking.orderId as any)._id.toString();
      await orderService.updateOrderStatus(orderIdStr);
    }

    return savedBooking;
  }
}
