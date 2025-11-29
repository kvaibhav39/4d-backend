import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "staff";
  isActive: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);


