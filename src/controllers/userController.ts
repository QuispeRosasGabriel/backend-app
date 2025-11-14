import { Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";


// Crear un nuevo usuario
export const createUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      firstName,
      lastName,
      password,
      email,
      phone,
      documentType,
      ruc,
      dni,
      description,
      isReseller,
      packageType,
    } = req.body;

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Correo electrónico ya registrado." });
    }

    // 🔹 Encriptar contraseña antes de guardar
    const saltRounds = 10; // nivel de seguridad (más alto = más lento)
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el nuevo usuario con la contraseña cifrada
    const user = new User({
      firstName,
      lastName,
      password: hashedPassword, // se guarda el hash, no el texto plano
      email,
      phone,
      documentType,
      ruc,
      dni,
      description,
      isReseller,
      packageType,
    });

    await user.save();

    return res.status(201).json({
      message: "Usuario creado satisfactoriamente.",
      user: {
        ...user.toObject(),
        password: undefined, // no enviamos la contraseña al cliente
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "¡Error al crear usuario!",
      error,
    });
  }
};

// Obtener todos los usuarios (con paginación)
export const getUsers = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const filter: any = {};

    if (req.query.isReseller) {
      filter.isReseller = req.query.isReseller === "true";
    }
    if (req.query.packageType) {
      filter.packageType = req.query.packageType;
    }

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / pageSize);

    if (page > totalPages && totalPages !== 0) {
      return res
        .status(400)
        .json({ message: "Page number exceeds total pages" });
    }

    const users = await User.find(filter)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        pageSize,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al recuperar usuarios",
      error,
    });
  }
};

// Obtener usuario por ID
export const getUserById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Formato de ID de usuario no válido" });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving user",
      error,
    });
  }
};

// Agregar un vehículo al historial de vistos recientemente
export const addRecentVehicle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, vehicleId } = req.body;

    if (!userId || !vehicleId) {
      return res.status(400).json({ message: "userId y vehicleId son obligatorios." });
    }

    // Buscar al usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Si ya existe el vehículo en la lista, lo eliminamos para moverlo al frente (orden reciente)
    user.recentVehicles = (user.recentVehicles ?? []).filter(
      (v) => v.toString() !== vehicleId
    );

    // Insertar el nuevo vehículo al inicio
    user.recentVehicles.unshift(vehicleId);

    // Mantener máximo 3 vehículos
    if (user.recentVehicles.length > 3) {
      user.recentVehicles = user.recentVehicles.slice(0, 3);
    }

    await user.save();

    return res.status(200).json({
      message: "Vehículo agregado a recientes exitosamente.",
      recentVehicles: user.recentVehicles,
    });
  } catch (error) {
    console.error("Error al agregar vehículo a recientes:", error);
    return res.status(500).json({
      message: "Error al agregar vehículo a recientes.",
      error,
    });
  }
};


export const getRecentVehicles = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId es obligatorio." });
    }

    const user = await User.findById(userId)
      .populate({
        path: "recentVehicles",
        select: "brand model price year images",
        options: { lean: true },
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const vehiclesWithFilteredImages = (user.recentVehicles ?? []).map((v: any) => {
      const mainImage = v.images?.find((img: any) => img.isMain);
      return {
        ...v,
        images: mainImage ? [mainImage] : [],
      };
    });

    return res.status(200).json({
      message: "Vehículos recientes obtenidos correctamente.",
      recentVehicles: vehiclesWithFilteredImages,
    });
  } catch (error) {
    console.error("Error al obtener vehículos recientes:", error);
    res.status(500).json({
      message: "Error al obtener vehículos recientes.",
      error,
    });
  }
};

