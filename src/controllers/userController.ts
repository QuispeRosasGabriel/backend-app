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
    const { id } = req.params;

    if (!id || id.length !== 24) {
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
