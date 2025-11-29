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
    const { orgId, date } = params;

    const startDate = date
      ? new Date(date)
      : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const bookings = await Booking.find({
      orgId,
      $or: [
        { fromDateTime: { $gte: startDate, $lt: endDate } },
        { toDateTime: { $gte: startDate, $lt: endDate } },
      ],
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
}

