import mongoose, { Schema, Document } from "mongoose";

export type OrderStatus = "INITIATED" | "IN_PROGRESS" | "PARTIALLY_DONE" | "FULLY_DONE" | "CANCELLED";

export interface IOrder extends Document {
  orgId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  status: OrderStatus;
  totalAmount: number; // Sum of all active bookings' decidedRent
  totalReceived: number; // Sum of all payments received
  remainingAmount: number; // totalAmount - totalReceived
  bookings: mongoose.Types.ObjectId[]; // Array of booking IDs
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    status: {
      type: String,
      enum: ["INITIATED", "IN_PROGRESS", "PARTIALLY_DONE", "FULLY_DONE", "CANCELLED"],
      default: "INITIATED",
    },
    totalAmount: { type: Number, default: 0 },
    totalReceived: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    bookings: [{ type: Schema.Types.ObjectId, ref: "Booking" }],
  },
  { timestamps: true }
);

OrderSchema.index({ orgId: 1, status: 1 });
OrderSchema.index({ orgId: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>("Order", OrderSchema);

