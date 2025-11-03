import { Request, Response } from "express";
import { BrandModel } from "../models/BrandModel";
import { Vehicle } from "../models";

export const getAllBrands = async (req: Request, res: Response) => {
  try {
    const brands = await BrandModel.find().select("brand"); // only names
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: "Error fetching brands", error });
  }
};

export const getModelsByBrand = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { brand } = req.params;
    const record = await BrandModel.findOne({ brand });

    if (!record) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.status(200).json(record.models);
  } catch (error) {
    res.status(500).json({ message: "Error fetching models", error });
  }
};

export const getBrandModelHierarchy = async (req: Request, res: Response) => {
  try {
    // Agrupar por brand y model
    const results = await Vehicle.aggregate([
      {
        $group: {
          _id: { brand: "$brand", model: "$model" },
        },
      },
      {
        $group: {
          _id: "$_id.brand",
          models: { $addToSet: "$_id.model" },
        },
      },
      {
        $project: {
          _id: 0,
          brand: "$_id",
          models: 1,
        },
      },
      {
        $sort: { brand: 1 },
      },
    ]);

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Error building brand-model list", error });
  }
};
