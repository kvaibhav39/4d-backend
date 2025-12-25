import mongoose from "mongoose";
import { Order, OrderStatus } from "../models/Order";
import { Booking, BookingStatus, PaymentType } from "../models/Booking";
import { Product } from "../models/Product";
import { Organization } from "../models/Organization";
import { PaginationHelper, PaginatedResponse } from "../types/pagination";

export interface CreateOrderData {
  orgId: string;
  customerName: string;
  customerPhone?: string;
  bookings?: CreateOrderBookingData[];
}

export interface CreateOrderBookingData {
  productId: string;
  categoryId?: string;
  fromDateTime: Date;
  toDateTime: Date;
  decidedRent: number;
  advanceAmount: number;
  additionalItemsDescription?: string;
  overrideConflicts?: boolean;
}

export interface UpdateOrderData {
  customerName?: string;
  customerPhone?: string;
}

export interface ListOrdersFilters {
  orgId: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CollectPaymentData {
  amount: number;
  note?: string;
}

export interface InvoiceData {
  order: any;
  bookings: any[];
  totalAmount: number;
  totalReceived: number;
  remainingAmount: number;
  paymentHistory: any[];
  organization?: {
    name: string;
    code?: string;
  };
}

export class OrderService {
  /**
   * Calculate order totals based on active bookings
   */
  private async calculateOrderTotals(orderId: string): Promise<{
    totalAmount: number;
    totalReceived: number;
    remainingAmount: number;
  }> {
    const bookings = await Booking.find({
      orderId,
      status: { $ne: "CANCELLED" },
    });

    const totalAmount = bookings.reduce((sum, b) => sum + b.decidedRent, 0);

    const totalReceived = bookings.reduce((sum, booking) => {
      const paid =
        booking.payments
          .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
          .reduce((s, p) => s + p.amount, 0) -
        booking.payments
          .filter((p) => p.type === "REFUND")
          .reduce((s, p) => s + p.amount, 0);
      return sum + paid;
    }, 0);

    return {
      totalAmount,
      totalReceived,
      remainingAmount: totalAmount - totalReceived,
    };
  }

  /**
   * Update order status based on bookings and payments
   */
  async updateOrderStatus(orderId: string): Promise<OrderStatus> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "CANCELLED") {
      return "CANCELLED";
    }

    const bookings = await Booking.find({ orderId });

    // If all bookings are cancelled, order should be cancelled
    if (
      bookings.length > 0 &&
      bookings.every((b) => b.status === "CANCELLED")
    ) {
      order.status = "CANCELLED";
      await order.save();
      return "CANCELLED";
    }

    const activeBookings = bookings.filter((b) => b.status !== "CANCELLED");

    if (activeBookings.length === 0) {
      return order.status;
    }

    const { totalAmount, totalReceived } = await this.calculateOrderTotals(
      orderId
    );

    // Check if all bookings are fully returned
    const allReturned = activeBookings.every((b) => b.status === "RETURNED");

    // Check if full payment received
    const fullPaymentReceived = totalReceived >= totalAmount;

    // Check if any payment received
    const anyPaymentReceived = totalReceived > 0;

    let newStatus: OrderStatus = order.status;

    if (allReturned && fullPaymentReceived) {
      newStatus = "FULLY_DONE";
    } else if (fullPaymentReceived && !allReturned) {
      newStatus = "IN_PROGRESS";
    } else if (anyPaymentReceived && !fullPaymentReceived) {
      newStatus = "PARTIALLY_DONE";
    } else {
      newStatus = "INITIATED";
    }

    if (newStatus !== order.status) {
      order.status = newStatus;
      await order.save();
    }

    return newStatus;
  }

  /**
   * Create a new order with optional initial bookings
   */
  async createOrder(data: CreateOrderData) {
    const { orgId, customerName, customerPhone, bookings = [] } = data;

    // Create the order
    const order = await Order.create({
      orgId,
      customerName,
      customerPhone,
      status: "INITIATED",
      totalAmount: 0,
      totalReceived: 0,
      remainingAmount: 0,
      bookings: [],
    });

    // Add initial bookings if provided
    if (bookings.length > 0) {
      for (const bookingData of bookings) {
        await this.addBookingToOrder(order._id.toString(), orgId, bookingData);
      }
    }

    // Recalculate totals and status
    const totals = await this.calculateOrderTotals(order._id.toString());
    order.totalAmount = totals.totalAmount;
    order.totalReceived = totals.totalReceived;
    order.remainingAmount = totals.remainingAmount;
    await order.save();

    await this.updateOrderStatus(order._id.toString());

    return await this.getOrderById(order._id.toString(), orgId);
  }

  /**
   * Get order by ID with populated bookings
   */
  async getOrderById(id: string, orgId: string) {
    const order = await Order.findOne({ _id: id, orgId }).populate({
      path: "bookings",
      populate: [{ path: "productId" }, { path: "categoryId" }],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Recalculate totals to ensure accuracy
    const totals = await this.calculateOrderTotals(id);
    order.totalAmount = totals.totalAmount;
    order.totalReceived = totals.totalReceived;
    order.remainingAmount = totals.remainingAmount;
    await order.save();

    return order;
  }

  /**
   * List orders with filters and pagination
   */
  async listOrders(filters: ListOrdersFilters): Promise<PaginatedResponse<any>> {
    const { orgId, status, startDate, endDate, search, page: rawPage, limit: rawLimit } = filters;

    // Validate and set pagination params
    const { page, limit } = PaginationHelper.validateParams(rawPage, rawLimit);
    const skip = PaginationHelper.getSkip(page, limit);

    // Build query
    const query: any = { orgId };

    if (status) {
      query.status = status;
    }

    if (search && search.trim()) {
      // Search by customer name or phone number (case-insensitive)
      const searchTerm = search.trim();
      query.$or = [
        { customerName: { $regex: searchTerm, $options: "i" } },
        { customerPhone: { $regex: searchTerm, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        query.createdAt.$lt = end;
      }
    }

    // Execute count and find in parallel for better performance
    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate({
          path: "bookings",
          populate: [
            { path: "productId", select: "title code" },
            { path: "categoryId", select: "name" },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for better performance
    ]);

    const pagination = PaginationHelper.getMeta(page, limit, total);

    return {
      data: orders,
      pagination,
    };
  }

  /**
   * Update order customer details
   */
  async updateOrder(id: string, orgId: string, data: UpdateOrderData) {
    const order = await Order.findOne({ _id: id, orgId });
    if (!order) {
      throw new Error("Order not found");
    }

    if (data.customerName) {
      order.customerName = data.customerName;
    }
    if (data.customerPhone !== undefined) {
      order.customerPhone = data.customerPhone;
    }

    return await order.save();
  }

  /**
   * Add a booking to an order
   */
  async addBookingToOrder(
    orderId: string,
    orgId: string,
    bookingData: CreateOrderBookingData
  ) {
    const order = await Order.findOne({ _id: orderId, orgId });
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "CANCELLED") {
      throw new Error("Cannot add booking to cancelled order");
    }

    const {
      productId,
      categoryId,
      fromDateTime,
      toDateTime,
      decidedRent,
      advanceAmount,
      additionalItemsDescription,
      overrideConflicts,
    } = bookingData;

    // Verify product exists
    const product = await Product.findOne({ _id: productId, orgId });
    if (!product) {
      throw new Error("Product not found for this org");
    }

    const from = new Date(fromDateTime);
    const to = new Date(toDateTime);

    // Check for conflicts (excluding bookings in this order)
    const existingBookings = await Booking.find({ orderId });
    const conflicts = await Booking.find({
      orgId,
      productId,
      status: { $ne: "CANCELLED" },
      _id: { $nin: existingBookings.map((b) => b._id) },
      $or: [{ fromDateTime: { $lt: to }, toDateTime: { $gt: from } }],
    });

    if (conflicts.length > 0 && !overrideConflicts) {
      throw new Error("CONFLICT");
    }

    const remainingAmount = decidedRent - advanceAmount;

    // Create booking
    const booking = await Booking.create({
      orgId,
      orderId: order._id,
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
                type: "ADVANCE" as PaymentType,
                amount: advanceAmount,
                at: new Date(),
                note: `Advance received Rs.${advanceAmount.toFixed(2)}`,
              },
            ]
          : [],
    });

    // Add booking to order
    order.bookings.push(booking._id);

    // Recalculate totals
    const totals = await this.calculateOrderTotals(orderId);
    order.totalAmount = totals.totalAmount;
    order.totalReceived = totals.totalReceived;
    order.remainingAmount = totals.remainingAmount;
    await order.save();

    // Update order status
    await this.updateOrderStatus(orderId);

    return booking;
  }

  /**
   * Collect payment at order level and distribute proportionally to bookings
   */
  async collectOrderPayment(
    orderId: string,
    orgId: string,
    paymentData: CollectPaymentData
  ) {
    const order = await Order.findOne({ _id: orderId, orgId });
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "CANCELLED") {
      throw new Error("Cannot collect payment for cancelled order");
    }

    const { amount, note } = paymentData;

    // Get all active bookings
    const activeBookings = await Booking.find({
      orderId,
      status: { $ne: "CANCELLED" },
    });

    if (activeBookings.length === 0) {
      throw new Error("No active bookings in order");
    }

    // Calculate total rent of active bookings
    const totalRent = activeBookings.reduce((sum, b) => sum + b.decidedRent, 0);

    if (totalRent === 0) {
      throw new Error("Total rent is zero, cannot distribute payment");
    }

    // Filter bookings that still have remaining amount to be paid
    const bookingsNeedingPayment = activeBookings.filter((b) => {
      const totalPaid =
        b.payments
          .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
          .reduce((sum, p) => sum + p.amount, 0) -
        b.payments
          .filter((p) => p.type === "REFUND")
          .reduce((sum, p) => sum + p.amount, 0);
      const remaining = b.decidedRent - totalPaid;
      return remaining > 0;
    });

    if (bookingsNeedingPayment.length === 0) {
      throw new Error("All bookings in this order are already fully paid");
    }

    // Calculate total rent of bookings that still need payment
    const totalRentNeedingPayment = bookingsNeedingPayment.reduce(
      (sum, b) => sum + b.decidedRent,
      0
    );

    // Distribute payment proportionally only to bookings that need payment
    let remainingAmount = amount;
    const distributions: Array<{ bookingId: string; amount: number }> = [];

    for (let i = 0; i < bookingsNeedingPayment.length; i++) {
      const booking = bookingsNeedingPayment[i];
      const percentage = booking.decidedRent / totalRentNeedingPayment;

      // Calculate how much this booking still needs
      const bookingTotalPaid =
        booking.payments
          .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
          .reduce((sum, p) => sum + p.amount, 0) -
        booking.payments
          .filter((p) => p.type === "REFUND")
          .reduce((sum, p) => sum + p.amount, 0);
      const bookingRemaining = booking.decidedRent - bookingTotalPaid;

      // For the last booking, give it the remaining amount to avoid rounding issues
      const calculatedAmount =
        i === bookingsNeedingPayment.length - 1
          ? remainingAmount
          : Math.round(amount * percentage * 100) / 100;

      // Don't pay more than what the booking needs
      const distributedAmount = Math.min(
        calculatedAmount,
        bookingRemaining,
        remainingAmount
      );

      if (distributedAmount > 0 && bookingRemaining > 0) {
        // Add payment entry to booking
        booking.payments.push({
          type: "ADVANCE" as PaymentType,
          amount: distributedAmount,
          at: new Date(),
          note:
            note ||
            `Order payment (${distributedAmount.toFixed(2)} of ${amount.toFixed(
              2
            )})`,
        });

        // Update booking amounts
        const totalPaid =
          booking.payments
            .filter(
              (p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED"
            )
            .reduce((sum, p) => sum + p.amount, 0) -
          booking.payments
            .filter((p) => p.type === "REFUND")
            .reduce((sum, p) => sum + p.amount, 0);

        booking.advanceAmount = Math.max(booking.advanceAmount, totalPaid);
        booking.remainingAmount = booking.decidedRent - totalPaid;

        await booking.save();

        distributions.push({
          bookingId: booking._id.toString(),
          amount: distributedAmount,
        });

        remainingAmount -= distributedAmount;
      }
    }

    // Recalculate order totals
    const totals = await this.calculateOrderTotals(orderId);
    order.totalAmount = totals.totalAmount;
    order.totalReceived = totals.totalReceived;
    order.remainingAmount = totals.remainingAmount;
    await order.save();

    // Update order status
    await this.updateOrderStatus(orderId);

    return {
      order,
      distributions,
      totalDistributed: amount - remainingAmount,
    };
  }

  /**
   * Handle booking cancellation and redistribute advance if needed
   */
  async handleBookingCancellation(
    bookingId: string,
    orgId: string,
    refundAmount?: number
  ) {
    const booking = await Booking.findOne({ _id: bookingId, orgId });
    if (!booking) {
      throw new Error("Booking not found");
    }

    const orderId = booking.orderId.toString();
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Calculate total advance paid for this booking
    const bookingAdvance =
      booking.payments
        .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
        .reduce((sum, p) => sum + p.amount, 0) -
      booking.payments
        .filter((p) => p.type === "REFUND")
        .reduce((sum, p) => sum + p.amount, 0);

    // Get active bookings (excluding the one being cancelled)
    const activeBookings = await Booking.find({
      orderId,
      status: { $ne: "CANCELLED" },
      _id: { $ne: bookingId },
    });

    // Calculate how much can be transferred to other bookings
    let totalTransferable = 0;
    let finalRefundAmount =
      refundAmount !== undefined ? refundAmount : bookingAdvance;

    // Redistribute advance to remaining active bookings if any
    if (activeBookings.length > 0 && bookingAdvance > 0) {
      let remainingToDistribute = bookingAdvance;

      // Transfer only what each booking actually needs (no proportional distribution)
      // Process all active bookings, transferring only the remaining amount each needs
      for (let i = 0; i < activeBookings.length; i++) {
        const activeBooking = activeBookings[i];

        // Calculate how much this booking needs
        const bookingRemaining =
          activeBooking.decidedRent -
          (activeBooking.payments
            .filter(
              (p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED"
            )
            .reduce((sum, p) => sum + p.amount, 0) -
            activeBooking.payments
              .filter((p) => p.type === "REFUND")
              .reduce((sum, p) => sum + p.amount, 0));

        // Only transfer what the booking actually needs (must be positive), up to what we have left
        if (bookingRemaining > 0 && remainingToDistribute > 0) {
          const distributedAmount = Math.min(
            remainingToDistribute,
            bookingRemaining
          );

          // Populate product to get title for transfer note
          await activeBooking.populate("productId");
          const product = activeBooking.productId as any;
          const productTitle = product?.title || "Product";

          // Add payment entry to receiving booking
          activeBooking.payments.push({
            type: "ADVANCE" as PaymentType,
            amount: distributedAmount,
            at: new Date(),
            note: `Advance redistributed from cancelled booking #${bookingId}`,
          });

          const totalPaid =
            activeBooking.payments
              .filter(
                (p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED"
              )
              .reduce((sum, p) => sum + p.amount, 0) -
            activeBooking.payments
              .filter((p) => p.type === "REFUND")
              .reduce((sum, p) => sum + p.amount, 0);

          activeBooking.advanceAmount = Math.max(
            activeBooking.advanceAmount,
            totalPaid
          );
          activeBooking.remainingAmount = activeBooking.decidedRent - totalPaid;

          await activeBooking.save();

          // Add payment entry to cancelled booking showing the transfer
          booking.payments.push({
            type: "REFUND" as PaymentType,
            amount: distributedAmount,
            at: new Date(),
            note: `Rs.${distributedAmount.toFixed(
              2
            )} transferred to ${productTitle}`,
          });

          remainingToDistribute -= distributedAmount;
          totalTransferable += distributedAmount;
        }
      }

      // If refund amount not provided, use remaining after transfer
      if (refundAmount === undefined) {
        finalRefundAmount = remainingToDistribute;
      }
    }

    // Validate refund amount
    const maxRefund = bookingAdvance - totalTransferable;
    if (finalRefundAmount > maxRefund) {
      throw new Error(
        `Refund amount (Rs.${finalRefundAmount.toFixed(
          2
        )}) cannot exceed maximum refund (Rs.${maxRefund.toFixed(
          2
        )}) after transfers.`
      );
    }
    if (finalRefundAmount < 0) {
      throw new Error("Refund amount cannot be negative");
    }

    // If there's a refund amount, create refund entry in the cancelled booking's payment history
    if (finalRefundAmount > 0) {
      booking.payments.push({
        type: "REFUND" as PaymentType,
        amount: finalRefundAmount,
        at: new Date(),
        note: "Refund for cancelled booking",
      });
    }

    // Recalculate booking amounts after all transfers and refunds
    const totalPaidAfterRefund =
      booking.payments
        .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
        .reduce((sum, p) => sum + p.amount, 0) -
      booking.payments
        .filter((p) => p.type === "REFUND")
        .reduce((sum, p) => sum + p.amount, 0);

    booking.advanceAmount = Math.max(0, totalPaidAfterRefund);
    booking.remainingAmount = booking.decidedRent - totalPaidAfterRefund;

    // Update booking status to cancelled
    booking.status = "CANCELLED";
    await booking.save();

    // Recalculate order totals
    const totals = await this.calculateOrderTotals(orderId);
    order.totalAmount = totals.totalAmount;
    order.totalReceived = totals.totalReceived;
    order.remainingAmount = totals.remainingAmount;
    await order.save();

    // Update order status (may auto-cancel if all bookings cancelled)
    await this.updateOrderStatus(orderId);

    return {
      refundAmount: Math.max(0, finalRefundAmount),
      redistributed: totalTransferable,
    };
  }

  /**
   * Preview refund amount for a booking cancellation (without actually cancelling)
   */
  async previewBookingCancellationRefund(
    bookingId: string,
    orgId: string
  ): Promise<{
    refundAmount: number;
    redistributed: number;
    bookingAdvance: number;
    transfers: Array<{
      bookingId: string;
      productTitle?: string;
      amount: number;
    }>;
  }> {
    const booking = await Booking.findOne({ _id: bookingId, orgId });
    if (!booking) {
      throw new Error("Booking not found");
    }

    const orderId = booking.orderId.toString();
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Calculate total advance paid for this booking
    const bookingAdvance =
      booking.payments
        .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
        .reduce((sum, p) => sum + p.amount, 0) -
      booking.payments
        .filter((p) => p.type === "REFUND")
        .reduce((sum, p) => sum + p.amount, 0);

    // Get active bookings (excluding the one being cancelled)
    const activeBookings = await Booking.find({
      orderId,
      status: { $ne: "CANCELLED" },
      _id: { $ne: bookingId },
    });

    let refundAmount = bookingAdvance;
    const transfers: Array<{
      bookingId: string;
      productTitle?: string;
      amount: number;
    }> = [];

    // Calculate how much can be redistributed to remaining active bookings
    if (activeBookings.length > 0 && bookingAdvance > 0) {
      let remainingToDistribute = bookingAdvance;

      // Transfer only what each booking actually needs (no proportional distribution)
      // Process all active bookings, transferring only the remaining amount each needs
      for (let i = 0; i < activeBookings.length; i++) {
        const activeBooking = activeBookings[i];

        // Populate product to get title
        await activeBooking.populate("productId");
        const product = activeBooking.productId as any;

        // Calculate how much this booking needs
        const bookingRemaining =
          activeBooking.decidedRent -
          (activeBooking.payments
            .filter(
              (p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED"
            )
            .reduce((sum, p) => sum + p.amount, 0) -
            activeBooking.payments
              .filter((p) => p.type === "REFUND")
              .reduce((sum, p) => sum + p.amount, 0));

        // Only transfer what the booking actually needs (must be positive), up to what we have left
        if (bookingRemaining > 0 && remainingToDistribute > 0) {
          const distributedAmount = Math.min(
            remainingToDistribute,
            bookingRemaining
          );

          transfers.push({
            bookingId: activeBooking._id.toString(),
            productTitle: product?.title || "Product",
            amount: distributedAmount,
          });
          remainingToDistribute -= distributedAmount;
        }
      }

      refundAmount = remainingToDistribute;
    }

    // Calculate total redistributed from transfers
    const totalRedistributed = transfers.reduce((sum, t) => sum + t.amount, 0);

    return {
      refundAmount: Math.max(0, refundAmount),
      redistributed: totalRedistributed,
      bookingAdvance,
      transfers,
    };
  }

  /**
   * Preview refund amount for order cancellation (without actually cancelling)
   */
  async previewOrderCancellationRefund(
    orderId: string,
    orgId: string
  ): Promise<{
    refundAmount: number;
    totalPaid: number;
  }> {
    const order = await Order.findOne({ _id: orderId, orgId });
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "CANCELLED") {
      throw new Error("Order is already cancelled");
    }

    // Get all bookings in the order
    const bookings = await Booking.find({ orderId });

    // Check if any booking is not in BOOKED status
    const nonBookedBookings = bookings.filter(
      (b) => b.status !== "BOOKED" && b.status !== "CANCELLED"
    );
    if (nonBookedBookings.length > 0) {
      const statuses = nonBookedBookings.map((b) => b.status).join(", ");
      throw new Error(
        `Cannot cancel order. Some bookings are not in "BOOKED" status. Found statuses: ${statuses}. Only bookings in "BOOKED" status can be cancelled.`
      );
    }

    // Calculate total amount paid across all bookings
    const totalPaid = bookings.reduce((sum, booking) => {
      const bookingPaid =
        booking.payments
          .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
          .reduce((s, p) => s + p.amount, 0) -
        booking.payments
          .filter((p) => p.type === "REFUND")
          .reduce((s, p) => s + p.amount, 0);
      return sum + bookingPaid;
    }, 0);

    // Total refund amount is the total paid (since all bookings will be cancelled)
    const refundAmount = Math.max(0, totalPaid);

    return {
      refundAmount,
      totalPaid,
    };
  }

  /**
   * Cancel order and all bookings with optional refund
   */
  async cancelOrder(
    orderId: string,
    orgId: string,
    refundAmount?: number,
    refundNote?: string
  ) {
    const order = await Order.findOne({ _id: orderId, orgId });
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "CANCELLED") {
      throw new Error("Order is already cancelled");
    }

    // Get all bookings in the order
    const bookings = await Booking.find({ orderId });

    // Check if any booking is not in BOOKED status (excluding already cancelled)
    const nonBookedBookings = bookings.filter(
      (b) => b.status !== "BOOKED" && b.status !== "CANCELLED"
    );
    if (nonBookedBookings.length > 0) {
      const statuses = nonBookedBookings.map((b) => b.status).join(", ");
      throw new Error(
        `Cannot cancel order. Some bookings are not in "BOOKED" status. Found statuses: ${statuses}. Only bookings in "BOOKED" status can be cancelled.`
      );
    }

    // Calculate total amount paid across all bookings
    const totalPaid = bookings.reduce((sum, booking) => {
      const bookingPaid =
        booking.payments
          .filter((p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED")
          .reduce((s, p) => s + p.amount, 0) -
        booking.payments
          .filter((p) => p.type === "REFUND")
          .reduce((s, p) => s + p.amount, 0);
      return sum + bookingPaid;
    }, 0);

    // Default refund amount is total paid if not provided
    const actualRefundAmount =
      refundAmount !== undefined ? refundAmount : Math.max(0, totalPaid);

    // Validate refund amount
    if (actualRefundAmount < 0) {
      throw new Error("Refund amount cannot be negative");
    }
    if (actualRefundAmount > totalPaid) {
      throw new Error(
        `Refund amount (Rs.${actualRefundAmount.toFixed(
          2
        )}) cannot exceed total paid (Rs.${totalPaid.toFixed(2)})`
      );
    }

    // Calculate refund distribution across bookings proportionally
    let remainingRefund = actualRefundAmount;
    const refundDistributions: Array<{ bookingId: string; amount: number }> =
      [];

    if (actualRefundAmount > 0 && totalPaid > 0) {
      for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];

        // Calculate how much this booking has paid
        const bookingPaid =
          booking.payments
            .filter(
              (p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED"
            )
            .reduce((s, p) => s + p.amount, 0) -
          booking.payments
            .filter((p) => p.type === "REFUND")
            .reduce((s, p) => s + p.amount, 0);

        if (bookingPaid > 0) {
          // Calculate proportional refund amount
          const bookingRefundPercentage = bookingPaid / totalPaid;
          const calculatedRefund =
            i === bookings.length - 1
              ? remainingRefund // Last booking gets remaining to avoid rounding issues
              : Math.round(actualRefundAmount * bookingRefundPercentage * 100) /
                100;

          const distributedRefund = Math.min(
            calculatedRefund,
            bookingPaid,
            remainingRefund
          );

          if (distributedRefund > 0) {
            // Add refund entry to booking
            booking.payments.push({
              type: "REFUND" as PaymentType,
              amount: distributedRefund,
              at: new Date(),
              note:
                refundNote ||
                `Order cancellation refund (Rs.${distributedRefund.toFixed(
                  2
                )} of Rs.${actualRefundAmount.toFixed(2)})`,
            });

            // Update booking amounts
            const totalPaidAfterRefund =
              booking.payments
                .filter(
                  (p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED"
                )
                .reduce((s, p) => s + p.amount, 0) -
              booking.payments
                .filter((p) => p.type === "REFUND")
                .reduce((s, p) => s + p.amount, 0);

            booking.advanceAmount = Math.max(0, totalPaidAfterRefund);
            booking.remainingAmount =
              booking.decidedRent - totalPaidAfterRefund;

            // Cancel booking
            booking.status = "CANCELLED";
            await booking.save();

            refundDistributions.push({
              bookingId: booking._id.toString(),
              amount: distributedRefund,
            });

            remainingRefund -= distributedRefund;
          } else {
            // Still cancel the booking even if no refund
            booking.status = "CANCELLED";
            await booking.save();
          }
        } else {
          // Cancel booking even if no payment was made
          booking.status = "CANCELLED";
          await booking.save();
        }
      }
    } else {
      // Cancel all bookings without refund
      for (const booking of bookings) {
        if (booking.status !== "CANCELLED") {
          booking.status = "CANCELLED";
          await booking.save();
        }
      }
    }

    // Update order status
    order.status = "CANCELLED";
    await order.save();

    // Recalculate totals
    const totals = await this.calculateOrderTotals(orderId);
    order.totalAmount = totals.totalAmount;
    order.totalReceived = totals.totalReceived;
    order.remainingAmount = totals.remainingAmount;
    await order.save();

    return {
      order,
      refundAmount: actualRefundAmount,
      refundDistributions,
    };
  }

  /**
   * Generate invoice data for an order
   */
  async generateInvoice(orderId: string, orgId: string): Promise<InvoiceData> {
    const order = await Order.findOne({ _id: orderId, orgId }).populate({
      path: "bookings",
      populate: [{ path: "productId" }, { path: "categoryId" }],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const bookings = await Booking.find({ orderId })
      .populate("productId")
      .populate("categoryId")
      .sort({ createdAt: 1 });

    // Collect all payment entries from all bookings
    const paymentHistory: any[] = [];
    bookings.forEach((booking) => {
      booking.payments.forEach((payment) => {
        paymentHistory.push({
          bookingId: booking._id.toString(),
          product: (booking.productId as any)?.title || "Unknown",
          type: payment.type,
          amount: payment.amount,
          at: payment.at,
          note: payment.note,
        });
      });
    });

    // Sort payment history by date (newest first)
    paymentHistory.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );

    const totals = await this.calculateOrderTotals(orderId);

    // Fetch organization data
    const organization = await Organization.findById(orgId);

    return {
      order: order.toObject(),
      bookings: bookings.map((b) => b.toObject()),
      totalAmount: totals.totalAmount,
      totalReceived: totals.totalReceived,
      remainingAmount: totals.remainingAmount,
      paymentHistory,
      organization: organization
        ? {
            name: organization.name,
            code: organization.code,
          }
        : undefined,
    };
  }
}
