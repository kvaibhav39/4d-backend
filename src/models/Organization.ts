import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>("Organization", OrganizationSchema);


