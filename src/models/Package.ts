import { Schema, model, Document } from "mongoose";

export interface IPackage extends Document {
  name: string;
  type:
    | "basic"
    | "medium"
    | "premium"
    | "reseller_basic"
    | "reseller_medium"
    | "reseller_premium";
  price: number;
  maxListings: number;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "basic",
        "medium",
        "premium",
        "reseller_basic",
        "reseller_medium",
        "reseller_premium",
      ],
      required: true,
    },
    price: { type: Number, required: true },
    maxListings: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Package = model<IPackage>("Package", PackageSchema);
