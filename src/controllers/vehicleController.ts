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
      images,
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
      images,
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

export const getVehicleById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    console.log("ID recibido:", id);

    // Validar ID
    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Formato de ID de vehículo inválido" });
    }

    // Buscar vehículo
    const vehicle = await Vehicle.findById(id)
      .populate("seller", "_id firstName lastName email phone")

    if (!vehicle) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    return res.status(200).json({
      message: "Vehículo encontrado con éxito",
      vehicle,
    });
  } catch (error) {
    console.error("Error al obtener vehículo por ID:", error);
    return res.status(500).json({ message: "Error al recuperar vehículo", error });
  }
};

export const getVehiclesByUserId = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "Se requiere ID de usuario." });
    }

    // Buscar vehículos asociados al usuario
    const vehicles = await Vehicle.find({ seller: userId });
    // Verificar si tiene vehículos
    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({ message: "No se han encontrado vehículos para esta usuario." });
    }

    // Devolver vehículos
    return res.status(200).json({
      message: "Vehículos recuperados con éxito.",
      total: vehicles.length,
      vehicles,
    });

  } catch (error) {
    console.error("Error al recuperar vehículos por ID de usuario:", error);
    return res.status(500).json({ message: "Error del servidor " });
  }
};


export const getFilteredVehicles = async (req: Request, res: Response): Promise<any> => {
  try {
    // 📥 Extraer filtros desde query params
    const {
      brand,
      model,
      year,
      color,
      transmission,
      type,
      fuelType,
      status,
      minPrice,
      maxPrice,
      minKm,
      maxKm,
      page = 1,
      pageSize = 25,
      sortBy = { createdAt: -1 },
    } = req.query;

    // 🧩 Crear objeto de filtros dinámico
    const filters: any = {};

    if (brand) filters.brand = { $regex: new RegExp(brand as string, "i") };
    if (model) filters.model = { $regex: new RegExp(model as string, "i") };
    if (year) filters.year = Number(year);
    if (color) filters.color = { $regex: new RegExp(color as string, "i") };
    if (fuelType) filters.fuelType = { $regex: new RegExp(fuelType as string, "i") };
    if (transmission) filters.transmission = { $regex: new RegExp(transmission as string, "i") };
    if (status) filters.status = { $regex: new RegExp(status as string, "i") };
    if (type) filters.type = type;

    // Filtros numéricos opcionales (rango)
    if (minPrice || maxPrice)
      filters.price = {
        ...(minPrice ? { $gte: Number(minPrice) } : {}),
        ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
      };

    if (minKm || maxKm)
      filters.km = {
        ...(minKm ? { $gte: Number(minKm) } : {}),
        ...(maxKm ? { $lte: Number(maxKm) } : {}),
      };

    // 🔢 Paginación
    const currentPage = Number(page);
    const limit = Number(pageSize);
    const skip = (currentPage - 1) * limit;

    let sortOption: any = { createdAt: -1 }; // por defecto: Avisos recientes

    switch (sortBy) {
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "year_desc":
        sortOption = { year: -1 };
        break;
      case "km_asc":
        sortOption = { km: 1 };
        break;
      case "relevance":
        sortOption = { verified: -1, createdAt: -1 }; // relevancia = verificados primero
        break;
      default:
        sortOption = { createdAt: -1 }; // Avisos recientes
        break;
    }

    // 📦 Obtener datos
    const [vehicles, totalCount] = await Promise.all([
      Vehicle.find(filters)
        .populate("seller", "firstName lastName email phone")
        .skip(skip)
        .limit(limit)
        .sort(sortOption)
        .lean(),
      Vehicle.countDocuments(filters),
    ]);

    // 🔍 Dejar solo la imagen principal dentro del arreglo `images`
    const vehiclesWithFilteredImages = vehicles.map((v) => {
      const mainImage = v.images?.find((img: any) => img.isMain);
      return {
        ...v,
        images: mainImage ? [mainImage] : [],
      };
    });

    res.status(200).json({
      message: "Vehículos obtenidos correctamente",
      filtersUsed: { ...filters, sortOption },
      pagination: {
        page: currentPage,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
      vehicles: vehiclesWithFilteredImages,
    });
  } catch (error) {
    console.error("Error al obtener vehículos filtrados:", error);
    res.status(500).json({
      message: "Error al obtener vehículos",
      error,
    });
  }
};
