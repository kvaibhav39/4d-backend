import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  code: string;
  subdomain: string;
  instagram?: string;
  facebook?: string;
  contact?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    subdomain: { type: String, required: true, unique: true },
    instagram: { type: String, required: false },
    facebook: { type: String, required: false },
    contact: { type: String, required: false },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>(
  "Organization",
  OrganizationSchema
);
