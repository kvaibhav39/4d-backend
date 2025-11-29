import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  orgId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  code: string;
  categoryId?: mongoose.Types.ObjectId;
  defaultRent: number;
  color?: string;
  size?: string;
  isActive: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    title: { type: String, required: true },
    description: { type: String },
    code: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    defaultRent: { type: Number, required: true },
    color: { type: String },
    size: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ orgId: 1, code: 1 }, { unique: true });

export const Product = mongoose.model<IProduct>("Product", ProductSchema);


