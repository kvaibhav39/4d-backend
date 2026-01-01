import mongoose, { Schema, Document } from "mongoose";

export type BookingStatus = "BOOKED" | "ISSUED" | "RETURNED" | "CANCELLED";

export type PaymentType =
  | "ADVANCE"
  | "RENT_REMAINING"
  | "PAYMENT_RECEIVED"
  | "REFUND";

export interface IPaymentEntry {
  type: PaymentType;
  amount: number;
  at: Date;
  note?: string;
}

export interface IBooking extends Document {
  orgId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId; // Reference to Order
  productId: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  fromDateTime: Date;
  toDateTime: Date;
  productDefaultRent: number;
  decidedRent: number;
  advanceAmount: number;
  remainingAmount: number;
  status: BookingStatus;
  isConflictOverridden: boolean;
  additionalItemsDescription?: string;
  payments: IPaymentEntry[];
  pendingRefundAmount?: number; // Amount pending refund when booking is cancelled without refund
}

const PaymentSchema = new Schema<IPaymentEntry>(
  {
    type: {
      type: String,
      enum: ["ADVANCE", "RENT_REMAINING", "PAYMENT_RECEIVED", "REFUND"],
      required: true,
    },
    amount: { type: Number, required: true },
    at: { type: Date, required: true, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    fromDateTime: { type: Date, required: true },
    toDateTime: { type: Date, required: true },
    productDefaultRent: { type: Number, required: true },
    decidedRent: { type: Number, required: true },
    advanceAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["BOOKED", "ISSUED", "RETURNED", "CANCELLED"],
      default: "BOOKED",
    },
    isConflictOverridden: { type: Boolean, default: false },
    additionalItemsDescription: { type: String },
    payments: { type: [PaymentSchema], default: [] },
    pendingRefundAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BookingSchema.index({ orgId: 1, productId: 1, fromDateTime: 1, toDateTime: 1 });
BookingSchema.index({ orderId: 1 });

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
