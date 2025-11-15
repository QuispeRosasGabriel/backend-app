import { Schema, model, Document, Types } from "mongoose";

export interface IImage {
  url: string;
  isMain: boolean;
}
export interface IVehicle extends Omit<Document, "model"> {
  km: number;
  color: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  type: string
  status: string;
  fuelType: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  images: IImage[];
  description?: string;
  transmission?: string;
  verified?: boolean;
  seller: Types.ObjectId;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const ImageSchema = new Schema<IImage>(
  {
    url: { type: String, required: true },
    isMain: { type: Boolean, required: true, default: false },
  }
);

const VehicleSchema = new Schema<IVehicle>(
  {
    km: { type: Number, required: true },
    color: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    transmission: { type: String, enum: ["Automatico", "Manual"], required: false },
    verified: { type: Boolean, required: false, default: false },
    price: { type: Number, required: true },
    type: { type: String, enum: ["SUV", "Sedan", "Pickup", "Hatchback", "Coupe", "Van", "Motorcycle", "Convertible"], required: true },
    status: { type: String, enum: ['Nuevo', 'Seminuevo', 'Usado'], required: true },
    fuelType: { type: String, enum: ["Gasolina", "Diesel", "Electrico", "Hibrido", "Gas Natural", "GLP"], required: true },
    images: { type: [ImageSchema], required: true, default: [] },
    description: { type: String, required: false },
    year: { type: Number, required: true },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    state: {
      type: String,
      enum: ["Publicado", "Vendido", "Eliminado"],
      default: "Publicado",
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Vehicle = model<IVehicle>("Vehicle", VehicleSchema);
