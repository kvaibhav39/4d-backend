import mongoose from "mongoose";
import { Booking } from "../models/Booking";

export interface DashboardStats {
  totalBookings: number;
  bookedCount: number;
  issuedCount: number;
  returnedCount: number;
  cancelledCount: number;
  totalRent: number;
  totalReceived: number;
}

export interface TopProduct {
  product: {
    _id: string;
    title: string;
    code: string;
    imageUrl?: string;
    defaultRent: number;
    category?: {
      _id: string;
      name: string;
    };
  };
  bookingCount: number;
}

export interface GetStatsParams {
  orgId: string;
  date?: string;
}

export class DashboardService {
  async getStats(params: GetStatsParams): Promise<DashboardStats> {
    const { orgId } = params;

    // Get all bookings for overall statistics (not filtered by date)
    const bookings = await Booking.find({
      orgId,
    });

    const stats: DashboardStats = {
      totalBookings: bookings.length,
      bookedCount: bookings.filter((b) => b.status === "BOOKED").length,
      issuedCount: bookings.filter((b) => b.status === "ISSUED").length,
      returnedCount: bookings.filter((b) => b.status === "RETURNED").length,
      cancelledCount: bookings.filter((b) => b.status === "CANCELLED").length,
      totalRent: bookings
        .filter((b) => b.status !== "CANCELLED")
        .reduce((sum, b) => sum + b.decidedRent, 0),
      totalReceived: bookings
        .filter((b) => b.status !== "CANCELLED")
        .reduce((sum, booking) => {
          const paid =
            booking.payments
              .filter(
                (p) => p.type === "ADVANCE" || p.type === "PAYMENT_RECEIVED"
              )
              .reduce((s, p) => s + p.amount, 0) -
            booking.payments
              .filter((p) => p.type === "REFUND")
              .reduce((s, p) => s + p.amount, 0);
          return sum + paid;
        }, 0),
    };

    return stats;
  }

  async getBookingsForDate(orgId: string, date?: string) {
    const startDate = date
      ? new Date(date)
      : new Date(new Date().setHours(0, 0, 0, 0));
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    // Filter by createdAt (booking creation date) to show bookings created on the selected date
    return await Booking.find({
      orgId,
      createdAt: { $gte: startDate, $lt: endDate },
    })
      .populate("productId")
      .populate("categoryId")
      .populate("orderId", "customerName customerPhone")
      .sort({ createdAt: -1 }); // Sort by creation date, newest first
  }

  async getRecentBookings(orgId: string, days: number = 5) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Filter by createdAt (booking creation date)
    return await Booking.find({
      orgId,
      createdAt: { $gte: startDate },
    })
      .populate("productId")
      .populate("categoryId")
      .populate("orderId", "customerName customerPhone")
      .sort({ createdAt: -1 });
  }

  async getCustomerPickups(orgId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    endDate.setHours(23, 59, 59, 999);

    // Filter by fromDateTime (pickup date) to show products ready for customer pickup
    // Show all past BOOKED bookings (overdue pickups) plus next 7 days
    // Only show bookings with BOOKED status (items not yet issued to customers)
    return await Booking.find({
      orgId,
      fromDateTime: { $lte: endDate }, // Include all past dates and next 7 days
      status: "BOOKED", // Only show BOOKED status (not yet issued)
    })
      .populate("productId")
      .populate("categoryId")
      .populate("orderId", "customerName customerPhone")
      .sort({ fromDateTime: 1 }); // Sort by fromDateTime ascending (earliest first)
  }

  async getCustomerReturns(orgId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    endDate.setHours(23, 59, 59, 999);

    // Filter by toDateTime (return date) to show products ready to return
    // Show all past ISSUED bookings (overdue returns) plus next 7 days
    // Only show bookings with ISSUED status (items already issued to customers, now due to be returned)
    return await Booking.find({
      orgId,
      toDateTime: { $lte: endDate }, // Include all past dates and next 7 days
      status: "ISSUED", // Only show ISSUED status (items already with customers)
    })
      .populate("productId")
      .populate("categoryId")
      .populate("orderId", "customerName customerPhone")
      .sort({ toDateTime: 1 }); // Sort by return date ascending (earliest first)
  }

  async getTopProducts(
    orgId: string,
    limit: number = 5
  ): Promise<TopProduct[]> {
    // Aggregate bookings by productId, excluding CANCELLED bookings
    const topProducts = await Booking.aggregate([
      {
        $match: {
          orgId: new mongoose.Types.ObjectId(orgId),
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
