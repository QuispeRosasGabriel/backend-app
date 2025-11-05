import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IUser, User } from "../models/User";

export interface AuthRequest extends Request {
  user: Partial<IUser>;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction):Promise<any> => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.JWT_SECRET || "default_secret_key";
    const decoded = jwt.verify(token, secretKey) as { id: string };

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token no válido o caducado" });
  }
};
