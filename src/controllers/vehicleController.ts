import { Request, Response } from "express";
import { Vehicle } from "../models/Vehicle";
import { canUserPublish } from "../utils";
import mongoose from "mongoose";
import { User } from "../models/User";


export const createVehicle = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      userId,
      km,
      color,
      brand,
      model,
      year,
      type,
      status,
      fuelType,
      lastMaintenanceDate,
      nextMaintenanceDate,
      price,
      verified,
      description,
      transmission,
    } = req.body;

    // Validar que userId sea válido
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID de usuario no válida o faltante" });
    }

    // Validar campos obligatorios (puedes añadir más según tu esquema)
    if (!brand || !model || !price || !year) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    /*   // Verificar si el usuario puede publicar más vehículos
      const canPublish = await canUserPublish(userId);
      if (!canPublish) {
        return res
          .status(403)
          .json({ message: "You have reached your publication limit." });
      } */

    // Crear el nuevo vehículo
    const vehicle = new Vehicle({
      seller: userId,
      km,
      color,
      brand,
      model,
      year,
      type,
      status,
      fuelType,
      transmission,
      price,
      description,
      verified: verified ?? false, // valor por defecto
      lastMaintenanceDate,
      nextMaintenanceDate,
    });

    await vehicle.save();
    await User.findByIdAndUpdate(
      userId,
      { $push: { vehicles: vehicle._id } },
      { new: true }
    );
    return res
      .status(201)
      .json({ message: "Vehículo publicado con éxito", vehicle });
  } catch (error) {
    console.error("Error al crear el vehículo: ", error);
    return res.status(500).json({ message: "Error al publicar el vehículo", error });
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
