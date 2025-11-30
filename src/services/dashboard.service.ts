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
      totalRent: bookings.reduce((sum, b) => sum + b.decidedRent, 0),
      totalReceived: bookings.reduce((sum, booking) => {
        const paid =
          booking.payments
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

  async getBookingsForDate(orgId: string, date?: string) {
    const startDate = date
      ? new Date(date)
      : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    return await Booking.find({
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
      .sort({ createdAt: -1 });
  }

  async getUpcomingBookings(orgId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    endDate.setHours(23, 59, 59, 999);

    return await Booking.find({
      orgId,
      fromDateTime: { $gte: startDate, $lte: endDate },
      status: { $in: ["BOOKED", "ISSUED"] }, // Only show active bookings
    })
      .populate("productId")
      .populate("categoryId")
      .sort({ fromDateTime: 1 }); // Sort by fromDateTime ascending (earliest first)
  }

  async getReadyForPickupBookings(orgId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    endDate.setHours(23, 59, 59, 999);

    // Filter by toDateTime (return date) to show products ready to return
    // Only show active bookings (BOOKED or ISSUED) that are due to be returned
    return await Booking.find({
      orgId,
      toDateTime: { $gte: startDate, $lte: endDate },
      status: { $in: ["BOOKED", "ISSUED"] }, // Only show active bookings
    })
      .populate("productId")
      .populate("categoryId")
      .sort({ toDateTime: 1 }); // Sort by return date ascending (earliest first)
  }
}
