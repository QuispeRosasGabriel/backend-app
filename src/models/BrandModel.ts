import mongoose from "mongoose";

const BrandModelSchema = new mongoose.Schema({
  brand: { type: String, required: true, unique: true },
  models: [{ type: String, required: true }],
});

export const BrandModel = mongoose.model("BrandModel", BrandModelSchema);
