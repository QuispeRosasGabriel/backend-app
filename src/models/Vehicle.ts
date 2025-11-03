import { Schema, model, Document, Types } from "mongoose";

export interface IVehicle extends Omit<Document, "model"> {
  km: string;
  color: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  status: string;
  type: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  description?: string;
  transmission?: string;
  verified?: boolean;
  seller: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    km: { type: String, required: true },
    color: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    transmission: { type: String, required: false },
    verified: { type: Boolean, required: false, default: false },
    price: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true },
    description: { type: String, required: false },
    year: { type: Number, required: true },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Vehicle = model<IVehicle>("Vehicle", VehicleSchema);
