import { Request, Response } from "express";
import { Vehicle } from "../models/Vehicle";
import { canUserPublish } from "../utils";

export const createVehicle = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const {
      userId,
      km,
      color,
      brand,
      model,
      year,
      type,
      lastMaintenanceDate,
      nextMaintenanceDate,
      price,
      verified,
      description,
      transmission,
      status,
    } = req.body;

    // Verificar si el usuario puede publicar más vehículos
    const canPublish = await canUserPublish(userId);
    if (!canPublish) {
      return res
        .status(403)
        .json({ message: "You have reached your publication limit." });
    }

    // Crear el nuevo vehículo
    const vehicle = new Vehicle({
      km,
      color,
      brand,
      model,
      type,
      price,
      description,
      verified,
      year,
      transmission,
      lastMaintenanceDate,
      nextMaintenanceDate,
      status,
      seller: userId,
    });

    await vehicle.save();

    return res
      .status(201)
      .json({ message: "Vehicle published successfully", vehicle });
  } catch (error) {
    return res.status(500).json({ message: "Error publishing vehicle", error });
  }
};

export const getVehicles = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    console.log("Fetching vehicles...");

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 9;
    const skip = (page - 1) * pageSize;

    // Filters
    const {
      km,
      color,
      brand,
      model,
      type,
      price,
      verified,
      year,
      transmission,
      lastMaintenanceDate,
      nextMaintenanceDate,
      status,
    } = req.query;

    const filter: any = {};

    if (km) filter.km = Number(km);
    if (color) filter.color = color;
    if (brand) filter.brand = brand;
    if (model) filter.model = model;
    if (type) filter.type = type;
    if (price) filter.price = Number(price);
    if (verified !== undefined) filter.verified = verified === "true";
    if (year) filter.year = Number(year);
    if (transmission) filter.transmission = transmission;
    if (lastMaintenanceDate) {
      filter.lastMaintenanceDate = {
        $gte: new Date(lastMaintenanceDate as string),
      };
    }
    if (nextMaintenanceDate) {
      filter.nextMaintenanceDate = {
        $lte: new Date(nextMaintenanceDate as string),
      };
    }
    if (status) filter.status = status;

    // Count total documents
    const totalVehicles = await Vehicle.countDocuments(filter);
    const totalPages = Math.ceil(totalVehicles / pageSize);

    if (page > totalPages && totalPages !== 0) {
      return res
        .status(400)
        .json({ message: "Page number exceeds total pages" });
    }

    // Get paginated results
    const vehicles = await Vehicle.find(filter)
      .skip(skip)
      .limit(pageSize)
      .populate("seller", "name lastName email phone");

    res.status(200).json({
      data: vehicles,
      pagination: {
        currentPage: page,
        totalPages,
        totalVehicles,
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving vehicles", error });
  }
};

export const getVehicleById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Invalid vehicle ID format" });
    }

    const vehicle = await Vehicle.findById(id).populate(
      "seller",
      "name lastName email phone"
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving vehicle", error });
  }
};
