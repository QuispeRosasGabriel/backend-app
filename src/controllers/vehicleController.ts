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

export const updateVehicle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Formato de ID de vehículo inválido" });
    }

    // Validar que el ID sea correcto
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de vehículo inválido." });
    }

    // Validar que haya campos para actualizar
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No se han enviado datos para actualizar." });
    }

    // Asegurar que no se cambie el seller directamente por seguridad
    if (updates.seller) delete updates.seller;

    // Actualizar el vehículo
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true } // devuelve el documento actualizado
    ).populate("seller", "_id firstName lastName email phone");

    if (!updatedVehicle) {
      return res.status(404).json({ message: "Vehículo no encontrado." });
    }

    return res.status(200).json({
      message: "Vehículo actualizado con éxito.",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error("Error al actualizar vehículo:", error);
    return res.status(500).json({ message: "Error del servidor al actualizar vehículo", error });
  }
};

export const softDeleteVehicle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { state: "Eliminado", deletedAt: new Date() },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    return res.status(200).json({
      message: "Vehículo eliminado correctamente (soft delete)",
      vehicle,
    });
  } catch (error) {
    console.error("Error al realizar soft delete:", error);
    return res.status(500).json({ message: "Error del servidor", error });
  }
};

export const markVehicleAsSold = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { state: "Vendido", deletedAt: null },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    return res.status(200).json({
      message: "Vehículo marcado como vendido",
      vehicle,
    });
  } catch (error) {
    console.error("Error marcando como vendido:", error);
    return res.status(500).json({ message: "Error del servidor", error });
  }
};

export const restoreVehicle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    // Solo restaurar si NO está ya Publicado
    if (vehicle.state === "Publicado") {
      return res.status(400).json({
        message: "El vehículo ya está Publicado.",
      });
    }

    // Restaurar
    vehicle.state = "Publicado";
    vehicle.deletedAt = null;

    await vehicle.save();

    return res.status(200).json({
      message: "Vehículo restaurado correctamente.",
      vehicle,
    });

  } catch (error) {
    console.error("Error restaurando vehículo:", error);
    return res.status(500).json({ message: "Error del servidor", error });
  }
};

export const getVehicles = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {

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
    const {
      status,
      search = "",
      page = 1,
      pageSize = 25,
      sortBy = 'recent'
    } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "Se requiere ID de usuario." });
    }

    // Filtros dinámicos
    const filters: any = { seller: userId };
    if (status) filters.status = { $regex: new RegExp(status as string, "i") };
    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      filters.$or = [{ brand: searchRegex }, { model: searchRegex }];
    }

    // Paginación
    const currentPage = Number(page);
    const limit = Number(pageSize);
    const skip = (currentPage - 1) * limit;

    // Ordenamiento (sort)
    let sortOption: any = { createdAt: -1, _id: 1 }; // <- estable por defecto

    switch (sortBy) {
      case "relevance":
        sortOption = { verified: -1, createdAt: -1, _id: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1, _id: 1 };
        break;
      case "price_asc":
        sortOption = { price: 1, _id: 1 };
        break;
      case "year_desc":
        sortOption = { year: -1, _id: 1 };
        break;
      case "km_asc":
        sortOption = { km: 1, _id: 1 };
        break;
      default:
        sortOption = { createdAt: -1, _id: 1 }; // <- Avisos más recientes
    }

    // Obtener vehículos filtrados y paginados
    const [vehicles, totalCount] = await Promise.all([
      Vehicle.find(filters)
        .populate("seller", "firstName lastName email phone")
        .skip(skip)
        .limit(limit)
        .sort(sortOption)
        .lean(),
      Vehicle.countDocuments(filters),
    ]);

    // Verificar resultados
    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({ message: "No se encontraron vehículos." });
    }

    // Dejar solo la imagen principal dentro del arreglo `images`
    const vehiclesWithFilteredImages = vehicles.map((v) => {
      const mainImage = v.images?.find((img: any) => img.isMain);
      return {
        ...v,
        images: mainImage ? [mainImage] : [],
      };
    });

    // Devolver vehículos
    res.status(200).json({
      message: "Vehículos recuperados con éxito.",
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
    console.error("Error al recuperar vehículos por ID de usuario:", error);
    res.status(500).json({ message: "Error del servidor ", error, });
  }
};


export const getFilteredVehicles = async (req: Request, res: Response): Promise<any> => {
  try {
    // Extraer filtros desde query params
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
      sortBy = "recent",
    } = req.query;

    // Crear objeto de filtros dinámico
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

    // Paginación
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

    // Obtener datos
    const [vehicles, totalCount] = await Promise.all([
      Vehicle.find(filters)
        .populate("seller", "firstName lastName email phone")
        .skip(skip)
        .limit(limit)
        .sort(sortOption)
        .lean(),
      Vehicle.countDocuments(filters),
    ]);

    // Dejar solo la imagen principal dentro del arreglo `images`
    const vehiclesWithFilteredImages = vehicles.map((v) => {
      const mainImage = v.images?.find((img: any) => img.isMain);
      return {
        ...v,
        images: mainImage ? [mainImage] : [],
      };
    });

    // Devolver vehículos
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
