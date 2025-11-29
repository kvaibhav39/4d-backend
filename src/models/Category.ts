import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ orgId: 1, name: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>("Category", CategorySchema);

