import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ruc: string;
  dni: string;
  description?: string;
  isReseller: boolean;
  packageType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    ruc: { type: String, required: false },
    dni: { type: String, required: false },
    description: { type: String },
    isReseller: { type: Boolean, default: false },
    packageType: {
      type: String,
      enum: [
        "basic",
        "medium",
        "premium",
        "reseller_basic",
        "reseller_medium",
        "reseller_premium",
      ],
    },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
